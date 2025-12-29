export type SessionTimerOptions = {
  inactivityLimitMs: number;      // e.g., 15 min
  warningSeconds: number;         // e.g., 30 sec
  onCountdown: (sec: number) => void;
  onTimeout: () => void;
  onWarningStart: () => void;
  onWarningEnd: () => void;
};

export class SessionTimer {
  private lastActivity = Date.now();
  private intervalId: NodeJS.Timeout | null = null;
  private warningActive = false;
  private countdown: number;

  constructor(private options: SessionTimerOptions) {
    this.countdown = options.warningSeconds;
  }

  start() {
    this.intervalId = setInterval(() => {
      const diff = Date.now() - this.lastActivity;
      const { inactivityLimitMs, warningSeconds } = this.options;

      // Trigger warning phase
      if (diff >= inactivityLimitMs - warningSeconds * 1000 && diff < inactivityLimitMs) {
        if (!this.warningActive) {
          this.warningActive = true;
          this.options.onWarningStart();
        }

        this.options.onCountdown(this.countdown);

        if (this.countdown <= 0) {
          this.options.onTimeout();
        }
        this.countdown--;
      }

      // Timeout
      if (diff >= inactivityLimitMs) {
        this.options.onTimeout();
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  reset() {
    this.lastActivity = Date.now();
    if (this.warningActive) {
      this.warningActive = false;
      this.countdown = this.options.warningSeconds;
      this.options.onWarningEnd();
    }
  }
}
