# Instruções para Implantação no Render.com

Este documento contém instruções detalhadas para implantar o sistema de gestão financeira no Render.com.

## Requisitos

- Uma conta no Render.com
- Conhecimentos básicos de implantação web
- Base de dados PostgreSQL ou SQLite

## Passos para Implantação

### 1. Preparar a Base de Dados

1. No painel do Render.com, crie um novo serviço de base de dados PostgreSQL
2. Anote as credenciais de acesso (host, nome da base de dados, utilizador, senha)
3. Utilize o ficheiro `schema.sql` para criar as tabelas necessárias:
   - Pode usar uma ferramenta como o pgAdmin para se conectar à base de dados
   - Execute o script SQL contido no ficheiro `schema.sql`

### 2. Configurar o Projeto

1. Edite o ficheiro `src/main.py` e atualize a configuração da base de dados:
   ```python
   app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
   ```

2. Certifique-se de que o ficheiro `requirements.txt` está atualizado com todas as dependências necessárias

### 3. Criar um Serviço Web no Render.com

1. No painel do Render.com, crie um novo serviço Web
2. Conecte ao seu repositório Git ou faça upload do código
3. Configure o serviço:
   - **Ambiente**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd src && python main.py`
   - **Variáveis de Ambiente**:
     - `DB_USERNAME`: Nome de utilizador da base de dados
     - `DB_PASSWORD`: Senha da base de dados
     - `DB_HOST`: Host da base de dados
     - `DB_NAME`: Nome da base de dados
     - `PORT`: 8080 (ou outro porto de sua preferência)

### 4. Implantação

1. Clique em "Create Web Service" para iniciar a implantação
2. Aguarde a conclusão do processo de build e implantação
3. Acesse o URL fornecido pelo Render.com para verificar se o sistema está funcionando corretamente

## Estrutura do Projeto

- `src/`: Código-fonte principal
  - `main.py`: Ponto de entrada da aplicação
  - `models/`: Modelos de dados
  - `routes/`: Rotas da API
  - `static/`: Arquivos estáticos (HTML, CSS, JS)
- `requirements.txt`: Dependências do projeto
- `schema.sql`: Esquema da base de dados

## Notas Importantes

- O sistema foi desenvolvido para funcionar com SQLite por padrão, mas pode ser facilmente adaptado para PostgreSQL (recomendado para produção)
- Certifique-se de configurar corretamente as variáveis de ambiente no Render.com
- Para uploads de arquivos (fotos de faturas), configure o armazenamento adequadamente no Render.com

## Suporte

Se encontrar algum problema durante a implantação, verifique:
1. Logs de erro no painel do Render.com
2. Configuração da base de dados
3. Variáveis de ambiente

Para mais informações sobre implantação no Render.com, consulte a [documentação oficial](https://render.com/docs).
