export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Debería estar hasheada
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  private users: Map<string, User> = new Map();

  constructor() {
    // Inicializar con algunos usuarios de ejemplo si es necesario
  }

  // Crear un nuevo usuario
  create(userData: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, user);
    return user;
  }

  // Buscar usuario por ID
  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  // Buscar usuario por email
  findByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  // Actualizar usuario
  update(
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>
  ): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Eliminar usuario
  delete(id: string): boolean {
    return this.users.delete(id);
  }

  // Obtener todos los usuarios
  getAll(): User[] {
    return Array.from(this.users.values());
  }

  // Validar credenciales (para login)
  validateCredentials(email: string, password: string): User | undefined {
    const user = this.findByEmail(email);
    if (user && user.password === password) {
      // En producción usar hash
      return user;
    }
    return undefined;
  }
}
