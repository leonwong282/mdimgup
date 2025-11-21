import * as vscode from "vscode";
import * as path from "path";

export interface UploadRecord {
  id: string;
  timestamp: string;
  profileId: string;
  profileName: string;
  documentUri: string;
  originalPath: string;
  uploadedUrl: string;
  uploadKey: string;
  fileSize: number;
  fileHash: string;
}

export class UploadHistoryManager {
  private static readonly STORAGE_KEY = "mdimgup.uploadHistory";
  private static readonly MAX_RECORDS = 1000;
  private records: UploadRecord[] = [];

  constructor(private context: vscode.ExtensionContext) {}

  async initialize(): Promise<void> {
    this.records = this.context.globalState.get<UploadRecord[]>(UploadHistoryManager.STORAGE_KEY, []);
  }

  async addRecord(record: Omit<UploadRecord, "id" | "timestamp">): Promise<UploadRecord> {
    const fullRecord: UploadRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.records.unshift(fullRecord);

    // Keep only most recent records
    if (this.records.length > UploadHistoryManager.MAX_RECORDS) {
      this.records = this.records.slice(0, UploadHistoryManager.MAX_RECORDS);
    }

    await this.save();
    return fullRecord;
  }

  async getRecords(filter?: {
    profileId?: string;
    documentUri?: string;
    limit?: number;
  }): Promise<UploadRecord[]> {
    let filtered = [...this.records];

    if (filter?.profileId) {
      filtered = filtered.filter((r) => r.profileId === filter.profileId);
    }

    if (filter?.documentUri) {
      filtered = filtered.filter((r) => r.documentUri === filter.documentUri);
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  async getRecordById(id: string): Promise<UploadRecord | null> {
    return this.records.find((r) => r.id === id) || null;
  }

  async deleteRecord(id: string): Promise<void> {
    this.records = this.records.filter((r) => r.id !== id);
    await this.save();
  }

  async clearHistory(filter?: { profileId?: string; olderThan?: Date }): Promise<number> {
    const before = this.records.length;

    if (filter?.profileId) {
      this.records = this.records.filter((r) => r.profileId !== filter.profileId);
    }

    if (filter?.olderThan) {
      const cutoff = filter.olderThan.toISOString();
      this.records = this.records.filter((r) => r.timestamp >= cutoff);
    }

    if (!filter) {
      this.records = [];
    }

    await this.save();
    return before - this.records.length;
  }

  private async save(): Promise<void> {
    await this.context.globalState.update(UploadHistoryManager.STORAGE_KEY, this.records);
  }
}

export interface NamingPattern {
  pattern: string;
  description?: string;
}

export class NamingPatternRenderer {
  private counter = 0;

  /**
   * Renders a naming pattern with variable substitution
   *
   * Supported variables:
   * - {timestamp} - Unix timestamp in milliseconds
   * - {date} - YYYY-MM-DD format
   * - {time} - HH-MM-SS format
   * - {datetime} - YYYY-MM-DD_HH-MM-SS format
   * - {filename} - Original filename without extension
   * - {ext} - File extension with dot (e.g., .png)
   * - {hash} - MD5 hash (first 8 chars)
   * - {hash:N} - MD5 hash (first N chars)
   * - {profile} - Profile name (sanitized)
   * - {counter} - Auto-incrementing counter (resets per session)
   * - {random} - Random 6-char string
   * - {random:N} - Random N-char string
   */
  render(pattern: string, context: {
    originalPath: string;
    hash: string;
    profileName: string;
  }): string {
    const basename = path.basename(context.originalPath);
    const ext = path.extname(basename);
    const filename = path.basename(basename, ext);

    const now = new Date();
    const timestamp = Date.now();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const datetime = `${date}_${time}`;

    const sanitizedProfile = context.profileName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    let result = pattern;

    // Replace variables
    result = result.replace(/\{timestamp\}/g, timestamp.toString());
    result = result.replace(/\{date\}/g, date);
    result = result.replace(/\{time\}/g, time);
    result = result.replace(/\{datetime\}/g, datetime);
    result = result.replace(/\{filename\}/g, filename);
    result = result.replace(/\{ext\}/g, ext);
    result = result.replace(/\{profile\}/g, sanitizedProfile);
    result = result.replace(/\{counter\}/g, (++this.counter).toString().padStart(4, '0'));

    // Hash with optional length
    result = result.replace(/\{hash(?::(\d+))?\}/g, (match, length) => {
      const len = length ? parseInt(length, 10) : 8;
      return context.hash.substring(0, len);
    });

    // Random with optional length
    result = result.replace(/\{random(?::(\d+))?\}/g, (match, length) => {
      const len = length ? parseInt(length, 10) : 6;
      return Math.random().toString(36).substring(2, 2 + len);
    });

    return result;
  }

  /**
   * Validates a naming pattern
   */
  validate(pattern: string): { valid: boolean; error?: string } {
    if (!pattern || pattern.trim().length === 0) {
      return { valid: false, error: "Pattern cannot be empty" };
    }

    // Check for valid variable syntax
    const validVars = [
      'timestamp', 'date', 'time', 'datetime',
      'filename', 'ext', 'hash', 'profile',
      'counter', 'random'
    ];

    const varRegex = /\{([^}:]+)(?::(\d+))?\}/g;
    let match;

    while ((match = varRegex.exec(pattern)) !== null) {
      const varName = match[1];
      if (!validVars.includes(varName)) {
        return { valid: false, error: `Unknown variable: {${varName}}` };
      }
    }

    // Must include filename or at least one unique identifier
    const hasUniqueId = /{(timestamp|datetime|hash|counter|random)/.test(pattern);
    if (!hasUniqueId) {
      return {
        valid: false,
        error: "Pattern must include at least one unique identifier (timestamp, datetime, hash, counter, or random)"
      };
    }

    return { valid: true };
  }

  /**
   * Get example output for a pattern
   */
  getExample(pattern: string): string {
    return this.render(pattern, {
      originalPath: "/path/to/image.png",
      hash: "a1b2c3d4e5f6g7h8",
      profileName: "Production Blog",
    });
  }
}

// Predefined naming pattern templates
export const NAMING_PATTERN_TEMPLATES: NamingPattern[] = [
  {
    pattern: "{timestamp}-{filename}{ext}",
    description: "Default: Timestamp + original filename (e.g., 1700000000000-screenshot.png)",
  },
  {
    pattern: "{datetime}-{filename}{ext}",
    description: "DateTime + filename (e.g., 2025-11-20_14-30-45-screenshot.png)",
  },
  {
    pattern: "{date}/{filename}-{hash:8}{ext}",
    description: "Date folder + filename + hash (e.g., 2025-11-20/screenshot-a1b2c3d4.png)",
  },
  {
    pattern: "{profile}/{date}/{counter}-{filename}{ext}",
    description: "Profile/date folders + counter (e.g., prod-blog/2025-11-20/0001-screenshot.png)",
  },
  {
    pattern: "{hash:12}{ext}",
    description: "Content-based hash only (e.g., a1b2c3d4e5f6.png)",
  },
  {
    pattern: "{date}-{time}-{random:4}{ext}",
    description: "Date-time + random suffix (e.g., 2025-11-20-14-30-45-x7k9.png)",
  },
];
