import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface HealthMetric {
  id: string;
  userId: string;
  metricType: string;
  value: number;
  unit?: string;
  secondaryValue?: number;
  source: string;
  notes?: string;
  recordedAt: Date;
  createdAt: Date;
}

export interface HealthGoal {
  id: string;
  userId: string;
  metricType: string;
  targetValue: number;
  currentValue: number;
  period: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class HealthService {
  // ==================
  // METRICS CRUD
  // ==================

  async getMetrics(userId: string, options: {
    metricType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ metrics: HealthMetric[]; total: number }> {
    try {
      // Build WHERE clause dynamically
      const conditions: string[] = [`user_id = '${userId}'`];
      
      if (options.metricType) {
        conditions.push(`metric_type = '${options.metricType.replace(/'/g, "''")}'`);
      }
      if (options.startDate) {
        conditions.push(`recorded_at >= '${options.startDate.replace(/'/g, "''")}'`);
      }
      if (options.endDate) {
        conditions.push(`recorded_at <= '${options.endDate.replace(/'/g, "''")}'`);
      }

      const whereClause = conditions.join(' AND ');
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      // Count query
      const countQuery = `SELECT COUNT(*) as count FROM bondarys.health_metrics WHERE ${whereClause}`;
      const countResult = await prisma.$queryRawUnsafe<any[]>(countQuery);
      const total = parseInt(countResult[0].count);

      // Get metrics with pagination
      const query = `
        SELECT * FROM bondarys.health_metrics
        WHERE ${whereClause}
        ORDER BY recorded_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await prisma.$queryRawUnsafe<any[]>(query);

      return {
        metrics: result.map(this.mapMetric),
        total,
      };
    } catch (error) {
      console.error('Error getting health metrics:', error);
      return { metrics: [], total: 0 };
    }
  }

  async getMetricById(id: string, userId: string): Promise<HealthMetric | null> {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM bondarys.health_metrics WHERE id = '${id.replace(/'/g, "''")}' AND user_id = '${userId.replace(/'/g, "''")}'
      `);

      return result[0] ? this.mapMetric(result[0]) : null;
    } catch (error) {
      console.error('Error getting health metric:', error);
      return null;
    }
  }

  async createMetric(data: {
    userId: string;
    metricType: string;
    value: number;
    unit?: string;
    secondaryValue?: number;
    source?: string;
    notes?: string;
    recordedAt?: string;
  }): Promise<HealthMetric | null> {
    try {
      const id = uuidv4();
      const unit = (data.unit || this.getDefaultUnit(data.metricType)).replace(/'/g, "''");
      const metricType = data.metricType.replace(/'/g, "''");
      const source = (data.source || 'manual').replace(/'/g, "''");
      const notes = data.notes ? data.notes.replace(/'/g, "''") : null;
      const recordedAt = data.recordedAt || new Date().toISOString();
      const secondaryValue = data.secondaryValue !== undefined ? data.secondaryValue : 'NULL';

      const result = await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO bondarys.health_metrics (id, user_id, metric_type, value, unit, secondary_value, source, notes, recorded_at, created_at)
        VALUES ('${id}', '${data.userId.replace(/'/g, "''")}', '${metricType}', ${data.value}, '${unit}', ${secondaryValue}, '${source}', ${notes ? `'${notes}'` : 'NULL'}, '${recordedAt}', NOW())
        RETURNING *
      `);

      // Update goal progress if applicable
      await this.updateGoalProgress(data.userId, data.metricType);

      return this.mapMetric(result[0]);
    } catch (error) {
      console.error('Error creating health metric:', error);
      return null;
    }
  }

  async updateMetric(id: string, userId: string, data: Partial<{
    value: number;
    secondaryValue: number;
    notes: string;
    recordedAt: string;
  }>): Promise<HealthMetric | null> {
    try {
      const updates: string[] = [];

      if (data.value !== undefined) {
        updates.push(`value = ${data.value}`);
      }
      if (data.secondaryValue !== undefined) {
        updates.push(`secondary_value = ${data.secondaryValue}`);
      }
      if (data.notes !== undefined) {
        updates.push(`notes = '${data.notes.replace(/'/g, "''")}'`);
      }
      if (data.recordedAt !== undefined) {
        updates.push(`recorded_at = '${data.recordedAt.replace(/'/g, "''")}'`);
      }

      if (updates.length === 0) return null;

      const result = await prisma.$queryRawUnsafe<any[]>(`
        UPDATE bondarys.health_metrics SET ${updates.join(', ')}
        WHERE id = '${id.replace(/'/g, "''")}' AND user_id = '${userId.replace(/'/g, "''")}'
        RETURNING *
      `);

      if (result[0]) {
        await this.updateGoalProgress(userId, result[0].metric_type);
      }

      return result[0] ? this.mapMetric(result[0]) : null;
    } catch (error) {
      console.error('Error updating health metric:', error);
      return null;
    }
  }

  async deleteMetric(id: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        DELETE FROM bondarys.health_metrics WHERE id = '${id.replace(/'/g, "''")}' AND user_id = '${userId.replace(/'/g, "''")}' RETURNING metric_type
      `);

      if (result[0]) {
        await this.updateGoalProgress(userId, result[0].metric_type);
      }

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting health metric:', error);
      return false;
    }
  }

  // ==================
  // GOALS CRUD
  // ==================

  async getGoals(userId: string, activeOnly: boolean = true): Promise<HealthGoal[]> {
    try {
      let query = `SELECT * FROM bondarys.health_goals WHERE user_id = '${userId.replace(/'/g, "''")}'`;
      if (activeOnly) {
        query += ` AND is_active = true`;
      }
      query += ` ORDER BY created_at DESC`;

      const result = await prisma.$queryRawUnsafe<any[]>(query);
      return result.map(this.mapGoal);
    } catch (error) {
      console.error('Error getting health goals:', error);
      return [];
    }
  }

  async createGoal(data: {
    userId: string;
    metricType: string;
    targetValue: number;
    period?: string;
  }): Promise<HealthGoal | null> {
    try {
      const id = uuidv4();
      const period = data.period || 'daily';
      
      // Deactivate existing goal of same type/period
      await prisma.$queryRawUnsafe(`
        UPDATE bondarys.health_goals SET is_active = false
        WHERE user_id = '${data.userId.replace(/'/g, "''")}' AND metric_type = '${data.metricType.replace(/'/g, "''")}' AND period = '${period.replace(/'/g, "''")}'
      `);

      const result = await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO bondarys.health_goals (id, user_id, metric_type, target_value, current_value, period, is_active, created_at, updated_at)
        VALUES ('${id}', '${data.userId.replace(/'/g, "''")}', '${data.metricType.replace(/'/g, "''")}', ${data.targetValue}, 0, '${period.replace(/'/g, "''")}', true, NOW(), NOW())
        RETURNING *
      `);

      // Calculate current progress
      await this.updateGoalProgress(data.userId, data.metricType);

      return this.mapGoal(result[0]);
    } catch (error) {
      console.error('Error creating health goal:', error);
      return null;
    }
  }

  async updateGoal(id: string, userId: string, data: Partial<{
    targetValue: number;
    isActive: boolean;
  }>): Promise<HealthGoal | null> {
    try {
      const updates: string[] = ['updated_at = NOW()'];

      if (data.targetValue !== undefined) {
        updates.push(`target_value = ${data.targetValue}`);
      }
      if (data.isActive !== undefined) {
        updates.push(`is_active = ${data.isActive}`);
      }

      const result = await prisma.$queryRawUnsafe<any[]>(`
        UPDATE bondarys.health_goals SET ${updates.join(', ')}
        WHERE id = '${id.replace(/'/g, "''")}' AND user_id = '${userId.replace(/'/g, "''")}'
        RETURNING *
      `);

      return result[0] ? this.mapGoal(result[0]) : null;
    } catch (error) {
      console.error('Error updating health goal:', error);
      return null;
    }
  }

  async deleteGoal(id: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        DELETE FROM bondarys.health_goals WHERE id = '${id.replace(/'/g, "''")}' AND user_id = '${userId.replace(/'/g, "''")}'
        RETURNING id
      `);
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting health goal:', error);
      return false;
    }
  }

  // ==================
  // ANALYTICS & INSIGHTS
  // ==================

  async getMetricSummary(userId: string, metricType: string, period: string = 'week'): Promise<{
    average: number;
    min: number;
    max: number;
    count: number;
    trend: number;
    data: Array<{ date: string; value: number }>;
  }> {
    try {
      let interval = '7 days';
      if (period === 'month') interval = '30 days';
      else if (period === 'year') interval = '365 days';

      const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          AVG(value) as average,
          MIN(value) as min,
          MAX(value) as max,
          COUNT(*) as count
        FROM bondarys.health_metrics
        WHERE user_id = '${userId.replace(/'/g, "''")}' AND metric_type = '${metricType.replace(/'/g, "''")}'
        AND recorded_at > NOW() - INTERVAL '${interval}'
      `);

      // Get daily data for chart
      const dataResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT DATE(recorded_at) as date, AVG(value) as value
        FROM bondarys.health_metrics
        WHERE user_id = '${userId.replace(/'/g, "''")}' AND metric_type = '${metricType.replace(/'/g, "''")}'
        AND recorded_at > NOW() - INTERVAL '${interval}'
        GROUP BY DATE(recorded_at)
        ORDER BY date
      `);

      // Calculate trend (compare last period to previous)
      const trendResult = await prisma.$queryRawUnsafe<any[]>(`
        WITH current_period AS (
          SELECT AVG(value) as avg FROM bondarys.health_metrics
          WHERE user_id = '${userId.replace(/'/g, "''")}' AND metric_type = '${metricType.replace(/'/g, "''")}'
          AND recorded_at > NOW() - INTERVAL '${interval}'
        ),
        previous_period AS (
          SELECT AVG(value) as avg FROM bondarys.health_metrics
          WHERE user_id = '${userId.replace(/'/g, "''")}' AND metric_type = '${metricType.replace(/'/g, "''")}'
          AND recorded_at > NOW() - INTERVAL '${interval}' * 2
          AND recorded_at <= NOW() - INTERVAL '${interval}'
        )
        SELECT
          COALESCE(c.avg, 0) as current_avg,
          COALESCE(p.avg, 0) as previous_avg
        FROM current_period c, previous_period p
      `);

      const stats = result[0];
      const trendData = trendResult[0];
      const trend = trendData.previous_avg > 0
        ? ((trendData.current_avg - trendData.previous_avg) / trendData.previous_avg) * 100
        : 0;

      return {
        average: parseFloat(stats.average || '0'),
        min: parseFloat(stats.min || '0'),
        max: parseFloat(stats.max || '0'),
        count: parseInt(stats.count || '0'),
        trend: Math.round(trend * 10) / 10,
        data: dataResult.map(row => ({
          date: row.date,
          value: parseFloat(row.value),
        })),
      };
    } catch (error) {
      console.error('Error getting metric summary:', error);
      return { average: 0, min: 0, max: 0, count: 0, trend: 0, data: [] };
    }
  }

  async getDashboard(userId: string): Promise<{
    todayMetrics: Record<string, number>;
    goals: HealthGoal[];
    recentMetrics: HealthMetric[];
    streaks: Record<string, number>;
  }> {
    try {
      // Get today's metrics
      const todayResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT metric_type, SUM(value) as total
        FROM bondarys.health_metrics
        WHERE user_id = '${userId.replace(/'/g, "''")}' AND DATE(recorded_at) = CURRENT_DATE
        GROUP BY metric_type
      `);

      const todayMetrics: Record<string, number> = {};
      todayResult.forEach(row => {
        todayMetrics[row.metric_type] = parseFloat(row.total);
      });

      // Get active goals with progress
      const goals = await this.getGoals(userId, true);

      // Get recent metrics
      const { metrics: recentMetrics } = await this.getMetrics(userId, { limit: 10 });

      // Calculate streaks (days in a row with logged metrics)
      const streakResult = await prisma.$queryRawUnsafe<any[]>(`
        WITH daily_logs AS (
          SELECT DISTINCT DATE(recorded_at) as log_date, metric_type
          FROM bondarys.health_metrics
          WHERE user_id = '${userId.replace(/'/g, "''")}'
          AND recorded_at > NOW() - INTERVAL '30 days'
        ),
        streak_calc AS (
          SELECT metric_type, log_date,
                 log_date - (ROW_NUMBER() OVER (PARTITION BY metric_type ORDER BY log_date))::int as grp
          FROM daily_logs
        )
        SELECT metric_type, MAX(count) as streak
        FROM (
          SELECT metric_type, COUNT(*) as count
          FROM streak_calc
          GROUP BY metric_type, grp
        ) s
        GROUP BY metric_type
      `);

      const streaks: Record<string, number> = {};
      streakResult.forEach(row => {
        streaks[row.metric_type] = parseInt(row.streak);
      });

      return { todayMetrics, goals, recentMetrics, streaks };
    } catch (error) {
      console.error('Error getting health dashboard:', error);
      return { todayMetrics: {}, goals: [], recentMetrics: [], streaks: {} };
    }
  }

  // ==================
  // HELPER METHODS
  // ==================

  private async updateGoalProgress(userId: string, metricType: string): Promise<void> {
    try {
      // Get active goal for this metric type
      const goalResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, period FROM bondarys.health_goals
        WHERE user_id = '${userId.replace(/'/g, "''")}' AND metric_type = '${metricType.replace(/'/g, "''")}' AND is_active = true
      `);

      if (goalResult.length === 0) return;

      const goal = goalResult[0];
      let interval = '1 day';
      if (goal.period === 'weekly') interval = '7 days';
      else if (goal.period === 'monthly') interval = '30 days';

      // Calculate current progress
      const progressResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT SUM(value) as total FROM bondarys.health_metrics
        WHERE user_id = '${userId.replace(/'/g, "''")}' AND metric_type = '${metricType.replace(/'/g, "''")}'
        AND recorded_at > NOW() - INTERVAL '${interval}'
      `);

      const currentValue = parseFloat(progressResult[0]?.total || '0');

      await prisma.$queryRawUnsafe(`
        UPDATE bondarys.health_goals SET current_value = ${currentValue}, updated_at = NOW()
        WHERE id = '${goal.id.replace(/'/g, "''")}'
      `);
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  }

  private getDefaultUnit(metricType: string): string {
    const units: Record<string, string> = {
      steps: 'steps',
      heart_rate: 'bpm',
      sleep: 'hours',
      weight: 'kg',
      blood_pressure: 'mmHg',
      blood_glucose: 'mg/dL',
      water: 'ml',
      calories: 'kcal',
      distance: 'km',
      active_minutes: 'minutes',
    };
    return units[metricType] || '';
  }

  private mapMetric(row: any): HealthMetric {
    return {
      id: row.id,
      userId: row.user_id,
      metricType: row.metric_type,
      value: parseFloat(row.value),
      unit: row.unit,
      secondaryValue: row.secondary_value ? parseFloat(row.secondary_value) : undefined,
      source: row.source,
      notes: row.notes,
      recordedAt: row.recorded_at,
      createdAt: row.created_at,
    };
  }

  private mapGoal(row: any): HealthGoal {
    return {
      id: row.id,
      userId: row.user_id,
      metricType: row.metric_type,
      targetValue: parseFloat(row.target_value),
      currentValue: parseFloat(row.current_value),
      period: row.period,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const healthService = new HealthService();
export default healthService;
