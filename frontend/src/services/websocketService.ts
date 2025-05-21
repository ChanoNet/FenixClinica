/**
 * Servicio para gestionar la conexión WebSocket con el backend
 */

// Tipos para los eventos de WebSocket
export type WebSocketEventType = 
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_deleted'
  | 'appointment_reminder'
  | 'notification';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
}

// Interfaz para los callbacks de eventos
type EventCallback = (payload: any) => void;

// Clave para almacenar el estado de disponibilidad de WebSocket en localStorage
const WS_AVAILABILITY_KEY = 'ws_notifications_available';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private eventListeners: Map<WebSocketEventType, EventCallback[]> = new Map();
  private isConnecting = false;
  private notificationsAvailable: boolean;
  
  constructor() {
    // Verificar si ya se ha determinado la disponibilidad en sesiones anteriores
    const savedAvailability = localStorage.getItem(WS_AVAILABILITY_KEY);
    this.notificationsAvailable = savedAvailability !== 'false';
  }

  /**
   * Verifica si las notificaciones están disponibles en el backend
   * @returns Promise<boolean>
   */
  async checkNotificationsAvailability(): Promise<boolean> {
    // Si ya hemos determinado que no están disponibles, no volver a verificar
    if (localStorage.getItem(WS_AVAILABILITY_KEY) === 'false') {
      console.log('WebSocket no disponible (usando cache). Omitiendo verificación.');
      this.notificationsAvailable = false;
      return false;
    }
    
    try {
      // Realizar una petición HEAD para verificar si el endpoint existe
      const wsProtocol = window.location.protocol === 'https:' ? 'https' : 'http';
      const url = `${wsProtocol}://localhost:8000/ws/notifications/`;
      
      const response = await fetch(url, { method: 'HEAD' });
      const isAvailable = response.status !== 404;
      
      // Guardar el resultado en localStorage para futuras sesiones
      this.notificationsAvailable = isAvailable;
      localStorage.setItem(WS_AVAILABILITY_KEY, isAvailable ? 'true' : 'false');
      
      if (!isAvailable) {
        console.log('WebSocket no disponible. Esta información se ha guardado para futuras sesiones.');
      }
      
      return isAvailable;
    } catch (error) {
      console.log('Error al verificar disponibilidad de notificaciones:', error);
      // Almacenar el resultado negativo en caso de error
      this.notificationsAvailable = false;
      localStorage.setItem(WS_AVAILABILITY_KEY, 'false');
      return false;
    }
  }

  /**
   * Inicia la conexión WebSocket
   * @param token Token de autenticación
   */
  async connect(token: string): Promise<void> {
    // Si ya hay una conexión activa o está en proceso, no hacer nada
    if (this.socket || this.isConnecting) {
      return;
    }

    // Si ya sabemos que las notificaciones no están disponibles, no intentar conectar
    if (!this.notificationsAvailable) {
      console.log('Las notificaciones no están disponibles en el backend');
      return;
    }

    this.isConnecting = true;

    // Verificar si las notificaciones están disponibles
    if (this.reconnectAttempts === 0) {
      this.notificationsAvailable = await this.checkNotificationsAvailability();
      if (!this.notificationsAvailable) {
        console.log('Notificaciones no disponibles en el backend. Desactivando WebSocket.');
        this.isConnecting = false;
        return;
      }
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://localhost:8000/ws/notifications/?token=${token}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Cierra la conexión WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Suscribe a un tipo de evento
   * @param eventType Tipo de evento
   * @param callback Función a llamar cuando ocurre el evento
   */
  subscribe(eventType: WebSocketEventType, callback: EventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.push(callback);
    }
  }

  /**
   * Desuscribe de un tipo de evento
   * @param eventType Tipo de evento
   * @param callback Función a eliminar
   */
  unsubscribe(eventType: WebSocketEventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Envía un mensaje a través del WebSocket
   * @param message Mensaje a enviar
   */
  sendMessage(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket no está conectado. No se puede enviar el mensaje.');
    }
  }

  // Manejadores de eventos de WebSocket
  private handleOpen(event: Event): void {
    console.log('WebSocket conectado');
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    
    // Notificar que se ha conectado
    this.notifyListeners('notification', {
      message: 'Conectado al servidor en tiempo real',
      severity: 'success'
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      this.notifyListeners(data.type, data.payload);
    } catch (error) {
      console.error('Error al procesar mensaje de WebSocket:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket desconectado: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    
    // El código 1006 suele indicar que no se pudo establecer la conexión
    // Si este código aparece en el primer intento, probablemente el endpoint no existe
    if (event.code === 1006 && this.reconnectAttempts === 0) {
      console.log('Posible endpoint de WebSocket no disponible (código 1006)');
      
      // Verificar nuevamente si el endpoint existe
      this.checkNotificationsAvailability().then(available => {
        this.notificationsAvailable = available;
        
        if (!available) {
          console.log('Confirmado: Las notificaciones no están disponibles. Desactivando WebSocket.');
          // Guardar esta información para futuras sesiones
          localStorage.setItem(WS_AVAILABILITY_KEY, 'false');
          // No intentar reconectar si se confirmó que el endpoint no existe
          return;
        }
        
        // Si el endpoint existe pero hubo otro problema, intentar reconectar
        this.attemptReconnect();
      });
    }
    // Para otros casos de cierre no limpio, intentar reconectar normalmente
    else if (!event.wasClean && this.notificationsAvailable) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('Error en WebSocket:', event);
    this.isConnecting = false;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Número máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff
    
    console.log(`Intentando reconectar en ${delay}ms (intento ${this.reconnectAttempts})`);
    
    // Notificar que estamos intentando reconectar
    this.notifyListeners('notification', {
      message: `Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      severity: 'warning'
    });
    
    this.reconnectTimeout = window.setTimeout(() => {
      // Obtener un token fresco del localStorage
      const token = localStorage.getItem('token');
      if (token) {
        this.connect(token);
      } else {
        console.warn('No hay token disponible para reconectar WebSocket');
      }
    }, delay);
  }

  private notifyListeners(eventType: WebSocketEventType, payload: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error en listener de ${eventType}:`, error);
        }
      });
    }
  }
}

// Crear una instancia única para toda la aplicación
const websocketService = new WebSocketService();
export default websocketService;
