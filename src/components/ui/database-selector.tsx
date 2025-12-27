'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import { DatabaseType } from '@/lib/domain/database-type';

interface DatabaseSelectorProps {
  value: DatabaseType;
  onChange: (value: DatabaseType) => void;
}

export function DatabaseSelector({ value, onChange }: DatabaseSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">
        Database Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DatabaseType)}
        className="w-full p-3 border border-white/10 rounded-lg bg-white/5 backdrop-blur-sm text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={DatabaseType.GENERIC} className="bg-slate-900 text-white">Generic (Auto-detect)</option>
        <option value={DatabaseType.POSTGRESQL} className="bg-slate-900 text-white">PostgreSQL</option>
        <option value={DatabaseType.MYSQL} className="bg-slate-900 text-white">MySQL</option>
        <option value={DatabaseType.MARIADB} className="bg-slate-900 text-white">MariaDB</option>
        <option value={DatabaseType.SQL_SERVER} className="bg-slate-900 text-white">SQL Server</option>
        <option value={DatabaseType.SQLITE} className="bg-slate-900 text-white">SQLite</option>
        <option value={DatabaseType.ORACLE} className="bg-slate-900 text-white">Oracle</option>
      </select>
    </div>
  );
}
