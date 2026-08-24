"""
Live WebSocket Gateway — RefinaVoz Copilot via Gemini Multimodal Live API.

Permite conversação e reparação de fala em tempo real (Speech-to-Speech / Speech-to-Text)
com suporte a streaming bidirecional e interrupções (barge-in).
"""

import asyncio
import base64
import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai.types import LiveConnectConfig, Modality, Blob

from backend.core.config import settings
from backend.core.logger import logger
from backend.services.llm_client import _pick_api_key

live_router = APIRouter()


@live_router.websocket("/ws/live")
async def live_voice_endpoint(websocket: WebSocket):
    """
    Gateway WebSocket para streaming bidirecional com a Multimodal Live API do Gemini.
    - Cliente envia: chunks de áudio PCM 16kHz (em binário ou JSON {type: "audio", data: "base64"}).
    - Servidor envia: {type: "audio_chunk", data: "base64"} e {type: "text_chunk", text: "..."}.
    """
    await websocket.accept()
    logger.info("Cliente conectou ao Live Voice WebSocket Gateway.")

    if settings.USE_MOCK_LLM:
        logger.info("Modo MOCK ativo no Live WebSocket.")
        try:
            await websocket.send_json({
                "type": "ready",
                "mode": "mock",
                "model": "mock-live-audio",
                "message": "Live Voice Copilot MOCK iniciado. Fale qualquer coisa para receber eco."
            })
            while True:
                message = await websocket.receive_text()
                data = json.loads(message)
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                elif data.get("type") == "text":
                    await websocket.send_json({
                        "type": "text_chunk",
                        "text": f"[MOCK LIVE ECHO] Refinado: {data.get('text')}"
                    })
        except WebSocketDisconnect:
            logger.info("Cliente desconectou do Mock Live WebSocket.")
            return

    api_key = _pick_api_key()
    client = genai.Client(api_key=api_key)
    live_model = settings.LIVE_MODEL

    # Configuração da Live API com áudio + texto e suporte a anotações inteligentes
    system_instruction = """Você é o Copiloto de Voz e Assistente de Escrita do RefinaVoz.
Suas duas funções principais:
1. CONVERSA & PENSAMENTO CONJUNTO: Quando o usuário estiver conversando, debatendo ideias ou fazendo perguntas, converse de volta por VOZ com naturalidade, clareza e concisão. Espere e dialogue até que a ideia esteja madura.
2. ANOTAÇÃO & REFINAMENTO: Quando o usuário pedir explicitamente para registrar, anotar, formatar ou ditar (ex: 'anota isso', 'escreve aí', 'minuta pronta'), estruture o texto final impecável em português formal e sinalize a anotação com o bloco:
<<<COMMIT_TEXT>>>
[O texto estruturado e refinado que deve ser colado na janela ativa]
<<<END_COMMIT_TEXT>>>
E em seguida diga por voz: 'Anotação pronta e colada no seu documento.'"""

    config = LiveConnectConfig(
        response_modalities=[Modality.AUDIO, Modality.TEXT],
        system_instruction=system_instruction
    )

    try:
        async with client.aio.live.connect(model=live_model, config=config) as session:
            await websocket.send_json({
                "type": "ready",
                "mode": "live",
                "model": live_model,
                "message": "Copiloto Live Voice ativo. Conversação por voz conectada."
            })

            async def receive_from_client():
                """Lê áudio e comandos vindos do cliente desktop e repassa para a Live API."""
                try:
                    while True:
                        msg = await websocket.receive()
                        if "bytes" in msg and msg["bytes"]:
                            # Envio de áudio cru PCM 16kHz
                            raw_pcm = msg["bytes"]
                            await session.send_realtime_input(
                                audio=Blob(data=raw_pcm, mime_type="audio/pcm;rate=16000")
                            )
                        elif "text" in msg and msg["text"]:
                            data = json.loads(msg["text"])
                            msg_type = data.get("type")

                            if msg_type == "audio_chunk":
                                pcm_bytes = base64.b64decode(data.get("data", ""))
                                await session.send_realtime_input(
                                    audio=Blob(data=pcm_bytes, mime_type="audio/pcm;rate=16000")
                                )
                            elif msg_type == "text_prompt":
                                await session.send_realtime_input(
                                    text=data.get("text", "")
                                )
                            elif msg_type == "commit_trigger":
                                # Usuário apertou o botão/atalho de forçar anotação do que foi falado
                                await session.send_realtime_input(
                                    text="Por favor, estruture a versão final do que conversamos e emita no bloco <<<COMMIT_TEXT>>> para ser inserido."
                                )
                            elif msg_type == "ping":
                                await websocket.send_json({"type": "pong"})
                except WebSocketDisconnect:
                    logger.info("Cliente fechou a conexão de envio.")
                except Exception as e:
                    logger.error(f"Erro no receive_from_client: {e}")

            async def send_to_client():
                """Lê áudio e texto gerados pelo Gemini e transmite ao cliente desktop."""
                accumulated_text = ""
                try:
                    async for response in session.receive():
                        server_content = getattr(response, "server_content", None)
                        
                        # Suporte nativo a interrupção (Barge-in)
                        if server_content and getattr(server_content, "interrupted", False):
                            accumulated_text = ""
                            await websocket.send_json({"type": "interrupted"})
                            continue

                        # Envio de chunks de texto (legendas/transcrição corrigida)
                        if response.text:
                            accumulated_text += response.text
                            await websocket.send_json({
                                "type": "text_chunk",
                                "text": response.text
                            })
                            
                            # Se detectou bloco de commit de texto para colar
                            if "<<<COMMIT_TEXT>>>" in accumulated_text and "<<<END_COMMIT_TEXT>>>" in accumulated_text:
                                start_idx = accumulated_text.find("<<<COMMIT_TEXT>>>") + len("<<<COMMIT_TEXT>>>")
                                end_idx = accumulated_text.find("<<<END_COMMIT_TEXT>>>")
                                commit_content = accumulated_text[start_idx:end_idx].strip()
                                
                                await websocket.send_json({
                                    "type": "commit_text",
                                    "text": commit_content,
                                    "auto_paste": True
                                })
                                # Reseta o buffer acumulado para a próxima fala
                                accumulated_text = accumulated_text[end_idx + len("<<<END_COMMIT_TEXT>>>"):]

                        # Envio de chunks de áudio (PCM 24kHz sintetizado da voz do Gemini)
                        if response.data:
                            encoded_chunk = base64.b64encode(response.data).decode("ascii")
                            await websocket.send_json({
                                "type": "audio_chunk",
                                "data": encoded_chunk,
                                "mime_type": "audio/pcm;rate=24000"
                            })
                except WebSocketDisconnect:
                    logger.info("Cliente fechou a conexão de recebimento.")
                except Exception as e:
                    logger.error(f"Erro no send_to_client: {e}")

            # Roda as duas tarefas em paralelo até que uma seja finalizada
            client_task = asyncio.create_task(receive_from_client())
            gemini_task = asyncio.create_task(send_to_client())

            done, pending = await asyncio.wait(
                [client_task, gemini_task],
                return_when=asyncio.FIRST_COMPLETED
            )

            for task in pending:
                task.cancel()

    except WebSocketDisconnect:
        logger.info("Conexão WebSocket finalizada pelo cliente.")
    except Exception as e:
        logger.error(f"Erro na sessão Live API: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
