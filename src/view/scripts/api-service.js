// filepath: c:\Users\tosta\Documents\projects\session-recorder\src\view\scripts\api-service.js

/**
 * Serviço de API para gerenciar sessões gravadas
 * Substitui o LocalStorageAdapter com chamadas HTTP
 */
class ApiService {
    constructor(baseUrl = 'https://ava.uniube.br/ava/api/marcapasso') {
        this.baseUrl = baseUrl;
        this.sessionsEndpoint = `${baseUrl}/sessions`;
    }

    /**
     * Busca todas as sessões do servidor
     * @returns {Promise<Array>} Array de sessões
     */
    async getAllSessions() {
        try {
            const response = await fetch(this.sessionsEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Para enviar cookies se necessário
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sessions = await response.json();
            
            // Converter strings de data para objetos Date
            return sessions.map(session => this.prepareSessionFromApi(session));
        } catch (error) {
            console.error('Erro ao buscar sessões:', error);
            throw error;
        }
    }

    /**
     * Busca uma sessão específica por ID
     * @param {string} sessionId - ID da sessão
     * @returns {Promise<Object|null>} Sessão encontrada ou null
     */
    async getSession(sessionId) {
        try {
            const response = await fetch(`${this.sessionsEndpoint}/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const session = await response.json();
            return this.prepareSessionFromApi(session);
        } catch (error) {
            console.error(`Erro ao buscar sessão ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Salva uma nova sessão no servidor
     * @param {Object} session - Sessão a ser salva
     * @returns {Promise<Object>} Sessão salva
     */
    async saveSession(session) {
        try {
            const sessionToSave = this.prepareSessionForApi(session);

            const response = await fetch(this.sessionsEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(sessionToSave)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const savedSession = await response.json();
            return this.prepareSessionFromApi(savedSession);
        } catch (error) {
            console.error('Erro ao salvar sessão:', error);
            throw error;
        }
    }

    /**
     * Atualiza uma sessão existente
     * @param {string} sessionId - ID da sessão
     * @param {Object} session - Dados atualizados da sessão
     * @returns {Promise<Object>} Sessão atualizada
     */
    async updateSession(sessionId, session) {
        try {
            const sessionToUpdate = this.prepareSessionForApi(session);

            const response = await fetch(`${this.sessionsEndpoint}/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(sessionToUpdate)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedSession = await response.json();
            return this.prepareSessionFromApi(updatedSession);
        } catch (error) {
            console.error(`Erro ao atualizar sessão ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Deleta uma sessão do servidor
     * @param {string} sessionId - ID da sessão
     * @returns {Promise<void>}
     */
    async deleteSession(sessionId) {
        try {
            const response = await fetch(`${this.sessionsEndpoint}/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return;
        } catch (error) {
            console.error(`Erro ao deletar sessão ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Deleta múltiplas sessões
     * @param {string[]} sessionIds - Array de IDs das sessões
     * @returns {Promise<void>}
     */
    async deleteSessions(sessionIds) {
        try {
            const response = await fetch(`${this.sessionsEndpoint}/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ sessionIds })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return;
        } catch (error) {
            console.error('Erro ao deletar múltiplas sessões:', error);
            // Fallback: deletar uma por uma
            const deletePromises = sessionIds.map(id => this.deleteSession(id));
            await Promise.all(deletePromises);
        }
    }

    /**
     * Busca sessões com filtros
     * @param {Object} filters - Filtros a aplicar
     * @param {string} filters.userId - Filtrar por usuário
     * @param {string} filters.startDate - Data inicial (ISO string)
     * @param {string} filters.endDate - Data final (ISO string)
     * @param {number} filters.limit - Limite de resultados
     * @param {number} filters.offset - Offset para paginação
     * @returns {Promise<Array>} Array de sessões filtradas
     */
    async getSessionsWithFilters(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.offset) queryParams.append('offset', filters.offset);

            const url = `${this.sessionsEndpoint}?${queryParams.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sessions = await response.json();
            return sessions.map(session => this.prepareSessionFromApi(session));
        } catch (error) {
            console.error('Erro ao buscar sessões com filtros:', error);
            throw error;
        }
    }

    /**
     * Prepara sessão para envio à API (converte Date para string)
     * @param {Object} session - Sessão a preparar
     * @returns {Object} Sessão preparada
     */
    prepareSessionForApi(session) {
        return {
            ...session,
            startTime: session.startTime instanceof Date 
                ? session.startTime.toISOString() 
                : session.startTime,
            endTime: session.endTime instanceof Date 
                ? session.endTime.toISOString() 
                : session.endTime,
            events: session.events.map(event => ({
                ...event,
                timestamp: event.timestamp instanceof Date 
                    ? event.timestamp.toISOString() 
                    : event.timestamp
            }))
        };
    }

    /**
     * Prepara sessão recebida da API (converte string para Date)
     * @param {Object} session - Sessão recebida da API
     * @returns {Object} Sessão preparada
     */
    prepareSessionFromApi(session) {
        return {
            ...session,
            startTime: new Date(session.startTime),
            endTime: new Date(session.endTime),
            events: session.events.map(event => ({
                ...event,
                timestamp: new Date(event.timestamp)
            }))
        };
    }

    /**
     * Exporta sessões em formato JSON
     * @param {string[]} sessionIds - IDs das sessões a exportar (opcional)
     * @returns {Promise<Blob>} Blob com dados JSON
     */
    async exportSessions(sessionIds = null) {
        try {
            const sessions = sessionIds 
                ? await Promise.all(sessionIds.map(id => this.getSession(id)))
                : await this.getAllSessions();

            const exportData = {
                exportDate: new Date().toISOString(),
                totalSessions: sessions.length,
                sessions: sessions.map(s => this.prepareSessionForApi(s))
            };

            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)], 
                { type: 'application/json' }
            );

            return blob;
        } catch (error) {
            console.error('Erro ao exportar sessões:', error);
            throw error;
        }
    }
}

// Exportar instância singleton
const apiService = new ApiService();
