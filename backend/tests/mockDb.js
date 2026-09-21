// In-memory test database mock for unit/integration tests without requiring an external DB
const usersStore = new Map();

const mockPool = {
  async query(text, params = []) {
    const trimmed = text.trim();

    // Health check query
    if (trimmed.includes('SELECT 1 AS alive')) {
      return { rows: [{ alive: 1 }] };
    }

    // Find user by email
    if (trimmed.includes('FROM users') && trimmed.includes('WHERE LOWER(email) = LOWER($1)')) {
      const email = params[0].toLowerCase();
      const user = usersStore.get(email);
      return { rows: user ? [user] : [] };
    }

    // Find user by id
    if (trimmed.includes('FROM users') && trimmed.includes('WHERE id = $1')) {
      const id = params[0];
      for (const u of usersStore.values()) {
        if (u.id === id) {
          return { rows: [u] };
        }
      }
      return { rows: [] };
    }

    // Insert user
    if (trimmed.startsWith('INSERT INTO users')) {
      const [id, email, password_hash, role] = params;
      const now = new Date().toISOString();
      const newUser = {
        id,
        email: email.toLowerCase(),
        password_hash,
        role,
        created_at: now,
        updated_at: now
      };
      usersStore.set(email.toLowerCase(), newUser);
      return {
        rows: [{
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        }]
      };
    }

    // Delete user
    if (trimmed.startsWith('DELETE FROM users')) {
      const email = params[0].toLowerCase();
      usersStore.delete(email);
      return { rows: [] };
    }

    return { rows: [] };
  },

  reset() {
    usersStore.clear();
  },

  async end() {
    // No-op for mock
  }
};

module.exports = mockPool;
