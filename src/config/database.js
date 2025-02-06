import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = new sqlite3.Database(
      path.resolve(__dirname, '../../urlshortener.db'),
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
      (err) => {
        if (err) {
          console.error('Error connecting to the database:', err);
          throw err;
        }
        console.log('Connected to the SQLite database');
      }
    );

    // Promisify database operations
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  async initialize() {
    try {
      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');

      // Create users table
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          google_id TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create URLs table
      await this.run(`
        CREATE TABLE IF NOT EXISTS urls (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          long_url TEXT NOT NULL,
          short_url TEXT UNIQUE NOT NULL,
          custom_alias TEXT UNIQUE,
          topic TEXT,
          active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create analytics table
      await this.run(`
        CREATE TABLE IF NOT EXISTS analytics (
          id TEXT PRIMARY KEY,
          url_id TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          referrer TEXT,
          os_type TEXT,
          device_type TEXT,
          country TEXT,
          city TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
        )
      `);

      // Create indices for better query performance
      await this.createIndices();

      console.log('Database tables and indices created successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createIndices() {
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)',
      'CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_urls_short_url ON urls(short_url)',
      'CREATE INDEX IF NOT EXISTS idx_urls_topic ON urls(topic)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON analytics(url_id)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics(country)'
    ];

    for (const index of indices) {
      await this.run(index);
    }
  }

  // Helper method for transactions
  async transaction(callback) {
    try {
      await this.run('BEGIN TRANSACTION');
      await callback();
      await this.run('COMMIT');
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // Query helpers
  async findById(table, id) {
    return await this.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  }

  async findOne(table, conditions) {
    const keys = Object.keys(conditions);
    const where = keys.map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(conditions);
    
    return await this.get(`SELECT * FROM ${table} WHERE ${where}`, values);
  }

  async findAll(table, conditions = {}) {
    const keys = Object.keys(conditions);
    let query = `SELECT * FROM ${table}`;
    
    if (keys.length > 0) {
      const where = keys.map(key => `${key} = ?`).join(' AND ');
      query += ` WHERE ${where}`;
      const values = Object.values(conditions);
      return await this.all(query, values);
    }
    
    return await this.all(query);
  }

  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = new Array(keys.length).fill('?').join(',');
    
    const query = `
      INSERT INTO ${table} (${keys.join(',')}) 
      VALUES (${placeholders})
    `;
    
    return await this.run(query, values);
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

// Create and initialize database instance
const db = new Database();
db.initialize().catch(console.error);

export default db;