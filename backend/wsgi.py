import sys
import os

# Caminho do projeto no PythonAnywhere
# Ajuste este caminho após fazer o clone no PythonAnywhere
project_home = '/home/SEUUSUARIO/aplicacao-am-atelie'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Adiciona a pasta backend ao path
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import app as application
