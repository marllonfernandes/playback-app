# Playback App

Aplicação web para processamento de áudio, permitindo separação de faixas (stems) utilizando **Demucs** e alteração de tom (pitch shifting).

## 🚀 Pré-requisitos

Certifique-se de ter instalado em sua máquina:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🛠️ Como Executar

A maneira mais recomendada de executar a aplicação é utilizando o Docker, pois ele gerencia todas as dependências complexas (Python, FFmpeg, Sox, Node.js) automaticamente.

### Passo a Passo

1.  **Clone o repositório** (se ainda não o fez):

    ```bash
    git clone <url-do-repositorio>
    cd playback-app
    ```

2.  **Inicie a aplicação**:
    Você pode utilizar o comando `make` configurado no projeto:

    ```bash
    make build
    ```

    Ou executar diretamente via Docker Compose:

    ```bash
    docker compose up -d --build
    ```

    _Este processo pode levar alguns minutos na primeira execução, pois irá baixar as imagens base e instalar as dependências._

3.  **Acesse a Aplicação**:
    Abra o navegador e visite:
    [http://localhost:3000](http://localhost:3000)

## 📂 Estrutura do Projeto

- **backend/**: API em Node.js/Express. Gerencia o processamento de áudio, executa scripts Python (Demucs) e serve os arquivos estáticos do frontend em produção.
- **frontend/**: Aplicação Vue.js 3 criada com Vite. Interface do usuário.
- **downloads/**: Diretório onde os arquivos de áudio processados são salvos. Este diretório é mapeado como um volume no Docker, garantindo que os arquivos persistam mesmo após reiniciar o container.
- **Dockerfile**: Define a imagem do container, instalando Python, Demucs, FFmpeg, Sox e Node.js.
- **docker-compose.yml**: Orquestração do container da aplicação.

## 📝 Comandos Úteis

- **Reiniciar a aplicação**:
  ```bash
  make restart
  # ou
  docker compose restart app
  ```
- **Parar a aplicação**:
  ```bash
  docker compose down
  ```
- **Verificar logs**:
  ```bash
  docker compose logs -f app
  ```

## ⚙️ Notas de Desenvolvimento

O `Dockerfile` está configurado para um ambiente "híbrido" onde o container constrói o frontend e o serve através do backend.

- A porta **3000** expõe o servidor Express.
- Os uploads e processamentos são salvos na pasta `./downloads` na raiz do projeto.
