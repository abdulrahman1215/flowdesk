import pytest
from pydantic import ValidationError

from app.schemas.user import UserLoginRequest, UserRegisterRequest


def test_register_accepts_72_byte_password() -> None:
    request = UserRegisterRequest(
        email="person@example.com",
        username="person_1",
        full_name="Person One",
        password="a" * 72,
    )

    assert request.password == "a" * 72


def test_register_rejects_password_over_bcrypt_limit() -> None:
    with pytest.raises(ValidationError, match="72 bytes or fewer"):
        UserRegisterRequest(
            email="person@example.com",
            username="person_1",
            full_name="Person One",
            password="a" * 73,
        )


def test_login_rejects_password_over_bcrypt_limit() -> None:
    with pytest.raises(ValidationError, match="72 bytes or fewer"):
        UserLoginRequest(
            email="person@example.com",
            password="a" * 73,
        )
