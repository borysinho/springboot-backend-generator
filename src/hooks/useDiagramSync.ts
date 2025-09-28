import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { CustomElement, UMLRelationship } from '../types';

interface PositionData {
  x: number;
  y: number;
}

interface DiagramOperation {
  type: 'add_element' | 'update_position' | 'delete_element' | 'add_relationship' | 'delete_relationship';
  elementId?: string;
  data: CustomElement | PositionData | UMLRelationship | Record<string, unknown>;
  timestamp: number;
  userId: string;
  userName: string;
}

interface UseDiagramSyncProps {
  onRemoteOperation: (operation: DiagramOperation) => void;
  currentUserId: string;
  currentUserName: string;
}

export const useDiagramSync = ({ onRemoteOperation, currentUserId, currentUserName }: UseDiagramSyncProps) => {
  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef(false);

  // Conectar al servidor
  useEffect(() => {
    if (isInitializedRef.current) return;

    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;
    isInitializedRef.current = true;

    // Escuchar operaciones remotas del diagrama
    socket.on('diagram_operation', (operation: DiagramOperation) => {
      // Ignorar nuestras propias operaciones para evitar bucles
      if (operation.userId === currentUserId) return;

      console.log('📥 Operación remota recibida:', operation);
      onRemoteOperation(operation);
    });

    socket.on('diagram_state_sync', (state: { elements: CustomElement[], relationships: UMLRelationship[] }) => {
      console.log('🔄 Estado del diagrama sincronizado:', state);
      // Aquí podrías manejar la sincronización completa del estado
    });

    return () => {
      socket.disconnect();
      isInitializedRef.current = false;
    };
  }, [onRemoteOperation, currentUserId]);

  // Función para enviar operaciones al servidor
  const sendOperation = useCallback((operation: Omit<DiagramOperation, 'timestamp' | 'userId' | 'userName'>) => {
    if (!socketRef.current) {
      console.warn('Socket no conectado, operación no enviada:', operation);
      return;
    }

    const fullOperation: DiagramOperation = {
      ...operation,
      timestamp: Date.now(),
      userId: currentUserId,
      userName: currentUserName,
    };

    console.log('📤 Enviando operación:', fullOperation);
    socketRef.current.emit('diagram_operation', fullOperation);
  }, [currentUserId, currentUserName]);

  // Funciones específicas para cada tipo de operación
  const addElement = useCallback((element: CustomElement) => {
    sendOperation({
      type: 'add_element',
      elementId: element.id,
      data: element,
    });
  }, [sendOperation]);

  const updateElementPosition = useCallback((elementId: string, x: number, y: number) => {
    sendOperation({
      type: 'update_position',
      elementId,
      data: { x, y },
    });
  }, [sendOperation]);

  const deleteElement = useCallback((elementId: string) => {
    sendOperation({
      type: 'delete_element',
      elementId,
      data: {},
    });
  }, [sendOperation]);

  const addRelationship = useCallback((relationship: UMLRelationship) => {
    sendOperation({
      type: 'add_relationship',
      elementId: relationship.id,
      data: relationship,
    });
  }, [sendOperation]);

  const deleteRelationship = useCallback((relationshipId: string) => {
    sendOperation({
      type: 'delete_relationship',
      elementId: relationshipId,
      data: {},
    });
  }, [sendOperation]);

  return {
    sendOperation,
    addElement,
    updateElementPosition,
    deleteElement,
    addRelationship,
    deleteRelationship,
    isConnected: socketRef.current?.connected ?? false,
  };
};