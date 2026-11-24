import "server-only";
import { Queue, Worker, type Processor, type JobsOptions, type Job } from "bullmq";
import { redis } from "@/server/integrations/redis/client";
import { createJobLogger } from "@/lib/logger";

export interface TenantJobPayload {
  schoolId: string;
  triggeredBy: string;
  data: Record<string, unknown>;
}

/**
 * Creates a BullMQ queue that enforces tenant scoping on all scheduled jobs.
 */
export function createTenantQueue<T extends TenantJobPayload, N extends string = string>(
  queueName: string,
): Queue<T, unknown, N> {
  const queue = new Queue<T, unknown, N>(queueName, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  return queue;
}

/**
 * Dispatches a job ensuring the tenant schoolId is present.
 */
export async function dispatchTenantJob<
  T extends TenantJobPayload,
  N extends string = string,
>(
  queue: Queue<T, unknown, N>,
  jobName: N,
  payload: T,
  opts?: JobsOptions,
): Promise<Job<T, unknown, N>> {
  if (!payload.schoolId) {
    throw new Error(`Cannot dispatch job '${jobName}' without schoolId tenant scope.`);
  }

  const jobLogger = createJobLogger(jobName, "pending", payload.schoolId);
  jobLogger.info("Enqueuing tenant background job");

  return (queue as Queue).add(jobName, payload, opts) as Promise<Job<T, unknown, N>>;
}

/**
 * Creates a worker for processing jobs within a specific queue.
 */
export function createTenantWorker<
  T extends TenantJobPayload,
  R = unknown,
  N extends string = string,
>(
  queueName: string,
  processor: Processor<T, R, N>,
  concurrency: number = 5,
): Worker<T, R, N> {
  const worker = new Worker<T, R, N>(queueName, processor, {
    connection: redis,
    concurrency,
  });

  worker.on("failed", (job, err) => {
    if (job) {
      const jobLogger = createJobLogger(job.name, job.id ?? "unknown", job.data.schoolId);
      jobLogger.error({ err }, "Job execution failed");
    }
  });

  return worker;
}
