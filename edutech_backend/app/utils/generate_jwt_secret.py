# generate_jwt_secret.py

import secrets
import string

def generate_secret_key(length=64):
    """Tạo một chuỗi secret key ngẫu nhiên gồm chữ, số và ký tự đặc biệt."""
    characters = string.ascii_letters + string.digits + string.punctuation
    secret_key = ''.join(secrets.choice(characters) for _ in range(length))
    return secret_key

if __name__ == "__main__":
    print("🔐 Generated JWT Secret Key:\n")
    print(generate_secret_key())
