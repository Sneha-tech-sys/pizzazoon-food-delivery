import re
from fastapi import HTTPException


def validate_email_format(email: str) -> bool:
    regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(regex, email))


def validate_phone_format(phone: str) -> bool:
    regex = r"^\+?[0-9]{10,15}$"
    return bool(re.match(regex, phone))
