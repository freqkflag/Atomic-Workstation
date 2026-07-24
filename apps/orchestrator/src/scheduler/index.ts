export interface ScheduledJob {
  id: string;
  cron: string;
  workflowId: string;
  timezone: string;
  enabled: boolean;
}

export class WorkflowScheduler {
  private jobs: ScheduledJob[] = [];

  register(job: ScheduledJob): void {
    this.jobs.push(job);
  }

  list(): ScheduledJob[] {
    return [...this.jobs];
  }

  dueJobs(now = new Date()): ScheduledJob[] {
    // Simplified: Sunday 6am UTC for weekly metrics (AE5)
    const isSunday6am =
      now.getUTCDay() === 0 && now.getUTCHours() === 6 && now.getUTCMinutes() < 5;
    return this.jobs.filter((j) => j.enabled && (j.workflowId === "ae5-weekly-metrics" ? isSunday6am : false));
  }
}

export function createDefaultScheduler(): WorkflowScheduler {
  const scheduler = new WorkflowScheduler();
  scheduler.register({
    id: "weekly-metrics",
    cron: "0 6 * * 0",
    workflowId: "ae5-weekly-metrics",
    timezone: "UTC",
    enabled: true,
  });
  return scheduler;
}
