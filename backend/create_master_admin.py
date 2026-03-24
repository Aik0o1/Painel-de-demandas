import os
import bcrypt
import psycopg2
from uuid import uuid4
from dotenv import load_dotenv

def create_admin():
    # Carrega variáveis de ambiente
    load_dotenv()
    
    # URL do banco de dados do ambiente (Docker usa 'db')
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Erro: DATABASE_URL não encontrada no ambiente.")
        return

    # Dados do Admin
    admin_email = "admin@jucepi.pi.gov.br"
    admin_password = "admin_password_change_me" # Recomendado trocar após o primeiro login
    admin_name = "Master Admin"
    admin_cpf = "000.000.000-00"
    
    # Hash da senha (compatível com NextAuth/bcryptjs)
    hashed = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Verifica se já existe
        cur.execute("SELECT id FROM \"User\" WHERE email = %s", (admin_email,))
        if cur.fetchone():
            print(f"Erro: Usuário com email {admin_email} já existe.")
            return

        # Insert User (incluindo createdAt e updatedAt explicitamente para evitar erros de constraint)
        user_id = str(uuid4())
        cur.execute("""
            INSERT INTO "User" (
                id, name, email, "passwordHash", role, status, cpf, position, "function", "protocolNumber", "createdAt", "updatedAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            user_id, 
            admin_name, 
            admin_email, 
            hashed, 
            "MASTER_ADMIN", 
            "ACTIVE", 
            admin_cpf, 
            "Administrador de Sistemas", 
            "ADMIN", 
            "GD-ADMIN01"
        ))
        
        conn.commit()
        print(f"Sucesso! Conta MASTER_ADMIN criada.")
        print(f"Email: {admin_email}")
        print(f"Senha: {admin_password}")
        print("Lembre-se de trocar a senha após o primeiro acesso.")
        
    except Exception as e:
        print(f"Erro ao conectar ou inserir no banco: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    create_admin()
