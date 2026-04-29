import magic
from fastapi import UploadFile, HTTPException, status

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

VALID_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "text/csv": [".csv"],
    "text/plain": [".txt"]
}

async def validate_upload_file(file: UploadFile):
    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="O arquivo excede o limite máximo permitido de 10 MB."
        )

    # MAGIC Mime type checking
    header = await file.read(2048)
    await file.seek(0) # reset pointer

    actual_mime_type = magic.from_buffer(header, mime=True)

    if actual_mime_type not in VALID_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de arquivo não suportado ou detectado magic number inválido ({actual_mime_type})."
        )
    return True
