export interface AgentStep {
  step: 'schema_introspection' | 'sql_planning' | 'execution' | 'self_healing' | 'visualization_synthesis';
  status: 'in_progress' | 'completed' | 'retry' | 'repaired';
  message: string;
  attempt?: number;
  data?: any;
}

export interface KeyMetric {
  label: string;
  value: string;
  trend?: 'positive' | 'negative' | 'neutral';
}

export interface ChartConfig {
  title: string;
  chart_type: 'bar' | 'line' | 'area' | 'pie' | 'metric_cards' | 'table';
  x_axis_key: string;
  y_axis_keys: string[];
  series_names?: string[];
  color_palette?: string[];
  executive_summary: string;
  key_metrics?: KeyMetric[];
  suggested_followups?: string[];
}

export interface QueryResultPayload {
  user_query: string;
  sql_query: string;
  execution_time_ms: number;
  total_pipeline_latency_ms: number;
  rows_scanned: number;
  total_rows: number;
  columns: string[];
  rows: Record<string, any>[];
  chart_spec: ChartConfig;
  database_mode: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  database_mode: string;
  is_cloud_clickhouse: boolean;
  gemini_active: boolean;
  model: string;
}

export interface TableInfo {
  columns: { name: string; type: string }[];
  sample_rows: Record<string, any>[];
  row_count: number;
}

export interface SchemaResponse {
  mode: string;
  is_cloud_clickhouse: boolean;
  tables: Record<string, TableInfo>;
}

export type ThemeMode = 'light' | 'dark';
