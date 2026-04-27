#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{HWND, RECT};
#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{
    BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject,
    GetDIBits, GetWindowDC, ReleaseDC, SelectObject, BITMAPINFO, BITMAPINFOHEADER,
    BI_RGB, DIB_RGB_COLORS, SRCCOPY,
};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowRect, SetForegroundWindow};

use base64::{engine::general_purpose, Engine as _};
use enigo::{Enigo, Keyboard, Key, Settings, Direction};
use image::{ImageBuffer, ImageFormat, Rgba};
use serde::Serialize;
use std::io::Cursor;
use std::time::Duration;

use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Window, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

#[derive(Serialize)]
struct CapturedVisualContext {
    data_url: String,
    mime_type: String,
    width: u32,
    height: u32,
}

// ─── Comandos Win32 (Apenas Windows) ───

#[tauri::command]
#[cfg(target_os = "windows")]
fn get_foreground_window_handle(window: Window) -> Result<isize, String> {
    let foreground_hwnd = unsafe { GetForegroundWindow() };
    let app_hwnd = window.hwnd().map_err(|e| e.to_string())?;

    if foreground_hwnd.0 == app_hwnd.0 {
        return Ok(0);
    }

    Ok(foreground_hwnd.0 as isize)
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn restore_focus_and_paste(hwnd_val: isize) -> Result<String, String> {
    unsafe {
        let hwnd = HWND(hwnd_val as *mut core::ffi::c_void);
        let _ = SetForegroundWindow(hwnd);
    }
    
    std::thread::sleep(Duration::from_millis(200));

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('v'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;

    Ok("OK".to_string())
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn restore_focus_and_select_all_copy(hwnd_val: isize) -> Result<String, String> {
    unsafe {
        let hwnd = HWND(hwnd_val as *mut core::ffi::c_void);
        let _ = SetForegroundWindow(hwnd);
    }

    std::thread::sleep(Duration::from_millis(180));

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('a'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;

    std::thread::sleep(Duration::from_millis(120));

    enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('c'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;

    Ok("OK".to_string())
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn capture_window_png(hwnd_val: isize) -> Result<CapturedVisualContext, String> {
    if hwnd_val == 0 {
        return Err("Nenhuma janela externa capturada para o contexto visual.".to_string());
    }

    let hwnd = HWND(hwnd_val as *mut core::ffi::c_void);
    let mut rect = RECT::default();
    unsafe { GetWindowRect(hwnd, &mut rect) }.map_err(|e| e.to_string())?;

    let width = rect.right - rect.left;
    let height = rect.bottom - rect.top;

    if width <= 0 || height <= 0 {
        return Err("Janela alvo sem dimensoes validas para captura.".to_string());
    }

    let mut pixels = unsafe { capture_window_pixels(hwnd, width, height)? };

    for pixel in pixels.chunks_exact_mut(4) {
        pixel.swap(0, 2);
        pixel[3] = 255;
    }

    let image_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width as u32, height as u32, pixels)
        .ok_or_else(|| "Falha ao montar imagem capturada.".to_string())?;

    let mut png_bytes = Cursor::new(Vec::new());
    image_buffer
        .write_to(&mut png_bytes, ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let encoded = general_purpose::STANDARD.encode(png_bytes.into_inner());
    Ok(CapturedVisualContext {
        data_url: format!("data:image/png;base64,{encoded}"),
        mime_type: "image/png".to_string(),
        width: width as u32,
        height: height as u32,
    })
}

#[cfg(target_os = "windows")]
unsafe fn capture_window_pixels(hwnd: HWND, width: i32, height: i32) -> Result<Vec<u8>, String> {
    let window_dc = GetWindowDC(Some(hwnd));
    if window_dc.is_invalid() {
        return Err("Falha ao obter contexto grafico da janela alvo.".to_string());
    }

    let mem_dc = CreateCompatibleDC(Some(window_dc));
    if mem_dc.is_invalid() {
        let _ = ReleaseDC(Some(hwnd), window_dc);
        return Err("Falha ao criar contexto grafico de memoria.".to_string());
    }

    let bitmap = CreateCompatibleBitmap(window_dc, width, height);
    if bitmap.is_invalid() {
        let _ = DeleteDC(mem_dc);
        let _ = ReleaseDC(Some(hwnd), window_dc);
        return Err("Falha ao criar bitmap de captura.".to_string());
    }

    let previous_object = SelectObject(mem_dc, bitmap.into());

    let copy_result = BitBlt(mem_dc, 0, 0, width, height, Some(window_dc), 0, 0, SRCCOPY);
    if let Err(error) = copy_result {
        let _ = SelectObject(mem_dc, previous_object);
        let _ = DeleteObject(bitmap.into());
        let _ = DeleteDC(mem_dc);
        let _ = ReleaseDC(Some(hwnd), window_dc);
        return Err(error.to_string());
    }

    let mut info = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width,
            biHeight: -height,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0,
            ..Default::default()
        },
        ..Default::default()
    };

    let mut pixels = vec![0u8; (width * height * 4) as usize];
    let rows = GetDIBits(
        mem_dc,
        bitmap,
        0,
        height as u32,
        Some(pixels.as_mut_ptr() as *mut _),
        &mut info,
        DIB_RGB_COLORS,
    );

    let _ = SelectObject(mem_dc, previous_object);
    let _ = DeleteObject(bitmap.into());
    let _ = DeleteDC(mem_dc);
    let _ = ReleaseDC(Some(hwnd), window_dc);

    if rows == 0 {
        return Err("Falha ao ler pixels da janela capturada.".to_string());
    }

    Ok(pixels)
}

// ─── Comandos macOS (Implementação Futura/Básica) ───

#[tauri::command]
#[cfg(target_os = "macos")]
fn get_foreground_window_handle() -> isize {
    // No macOS não usamos HWND (ponteiro de memória na forma de isize). 
    // Precisaria usar NSWorkspace. Retornando 0 e lidando visualmente.
    0
}

#[tauri::command]
#[cfg(target_os = "macos")]
fn restore_focus_and_paste(_hwnd_val: isize) -> Result<String, String> {
    // Foco volta naturalmente quando o click global termina, ou via AppleScript.
    std::thread::sleep(Duration::from_millis(200));

    // Simula Cmd+V
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    // Command no macOS mapeia para Meta em muitos teclados/bibliotecas, enigo usa Command/Meta
    enigo.key(Key::Meta, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('v'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Meta, Direction::Release).map_err(|e| e.to_string())?;

    Ok("OK".to_string())
}

#[tauri::command]
#[cfg(target_os = "macos")]
fn restore_focus_and_select_all_copy(_hwnd_val: isize) -> Result<String, String> {
    std::thread::sleep(Duration::from_millis(180));

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    enigo.key(Key::Meta, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('a'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Meta, Direction::Release).map_err(|e| e.to_string())?;

    std::thread::sleep(Duration::from_millis(120));

    enigo.key(Key::Meta, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('c'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Meta, Direction::Release).map_err(|e| e.to_string())?;

    Ok("OK".to_string())
}

#[tauri::command]
#[cfg(target_os = "macos")]
fn capture_window_png(_hwnd_val: isize) -> Result<CapturedVisualContext, String> {
    Err("Captura visual nativa ainda nao esta implementada no macOS.".to_string())
}

// ─── Entry Point com System Tray ───

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        // Setup: System Tray + Close-to-Tray
        .setup(|app| {
            // Menu de contexto do tray
            let show_item = MenuItem::with_id(app, "show", "Mostrar Widget", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Sair do RefinaVoz", true, None::<&str>)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&show_item)
                .separator()
                .item(&quit_item)
                .build()?;

            // Construir o ícone do tray
            let _tray = TrayIconBuilder::with_id("refinavoz-tray")
                .tooltip("RefinaVoz — Filtro de Fala SOTA")
                .icon(Image::from_bytes(include_bytes!("../icons/32x32.png"))?)
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                // Clique esquerdo no tray → toggle visibilidade do widget
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                            }
                        }
                    }
                })
                // Menu de contexto
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Interceptar evento de fechar → esconder em vez de fechar
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            Ok(())
        })
        // Comandos
        .invoke_handler(tauri::generate_handler![
            get_foreground_window_handle,
            capture_window_png,
            restore_focus_and_paste,
            restore_focus_and_select_all_copy
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
