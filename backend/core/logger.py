import logging
import sys

def get_logger(name: str = "refinavoz") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        handler = logging.StreamHandler(sys.stdout)
        
        # Formato JSON ou estruturado (simulado) para fácil rastreabilidade
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | [%(filename)s:%(lineno)d] | %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # Evitar log duplicado nas raízes do uvicorn
        logger.propagate = False
    return logger

logger = get_logger()
