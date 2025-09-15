FROM python:3.12

# Criar usuário não-root
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copiar e instalar requirements primeiro (para cache do Docker)
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copiar todo o código
COPY --chown=user . .

# Verificar se arquivos essenciais existem
RUN echo "=== Verificando estrutura de arquivos ===" && \
    ls -la /app/ && \
    echo "=== Verificando scripts ===" && \
    ls -la /app/scripts/ 2>/dev/null || echo "Diretório scripts não encontrado" && \
    echo "=== Verificando agents_config.json ===" && \
    if [ -f "/app/agents_config.json" ]; then \
        echo "✅ agents_config.json encontrado"; \
        ls -la /app/agents_config.json; \
    else \
        echo "⚠️ agents_config.json não encontrado - usando templates fallback"; \
    fi

# Configurar permissões (como root temporariamente)
USER root

# Criar scripts se não existirem e dar permissões
RUN if [ -f "/app/entrypoint_local.sh" ]; then \
        chmod +x /app/entrypoint_local.sh; \
        echo "✅ entrypoint_local.sh configurado"; \
    else \
        echo "⚠️ entrypoint_local.sh não encontrado - criando script padrão"; \
        echo '#!/bin/bash\necho "Iniciando aplicação..."\npython -m uvicorn app:app --host 0.0.0.0 --port 8000' > /app/entrypoint_local.sh; \
        chmod +x /app/entrypoint_local.sh; \
    fi

RUN if [ -f "/app/scripts/populate_agent_templates.py" ]; then \
        chmod +x /app/scripts/populate_agent_templates.py; \
        echo "✅ populate_agent_templates.py configurado"; \
    else \
        echo "⚠️ populate_agent_templates.py não encontrado"; \
        mkdir -p /app/scripts; \
        touch /app/scripts/populate_agent_templates.py; \
        chmod +x /app/scripts/populate_agent_templates.py; \
    fi

# Voltar para usuário não-root
USER user

# Expor porta
EXPOSE 8000

# Usar o script de entrypoint
CMD ["/app/entrypoint_local.sh"]
