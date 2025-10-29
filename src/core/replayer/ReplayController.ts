/**
 * Controls the playback flow of session replay
 */
export class ReplayController {
  private playing: boolean = false;
  private currentIndex: number = 0;
  private speed: number;
  private loop: boolean;
  private onCompleteCallback: () => void;
  private nextTimer: number | null = null;

  constructor(
    speed: number = 1,
    loop: boolean = false,
    onComplete: () => void = () => {}
  ) {
    this.speed = speed;
    this.loop = loop;
    this.onCompleteCallback = onComplete;
  }

  /**
   * Checks if playback is currently active
   */
  public isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Starts playback
   */
  public play(): void {
    this.playing = true;
  }

  /**
   * Pauses playback
   */
  public pause(): void {
    this.playing = false;
    this.cancelNextTimer();
  }

  /**
   * Stops playback and resets position
   */
  public stop(): void {
    this.playing = false;
    this.currentIndex = 0;
    this.cancelNextTimer();
  }

  /**
   * Completes playback and triggers completion callback
   */
  public complete(): void {
    this.playing = false;
    this.onCompleteCallback();
  }

  /**
   * Gets the current event index
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Sets the current event index
   */
  public setCurrentIndex(index: number): void {
    this.currentIndex = index;
  }

  /**
   * Increments the current event index
   */
  public incrementIndex(): void {
    this.currentIndex++;
  }

  /**
   * Sets the playback speed
   */
  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * Gets the current playback speed
   */
  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Resets the controller to initial state
   */
  public reset(): void {
    this.stop();
  }

  /**
   * Schedules the next action with a delay
   */
  public scheduleNext(callback: () => void, delayMs: number): void {
    this.cancelNextTimer();
    this.nextTimer = window.setTimeout(callback, delayMs);
  }

  /**
   * Cancels any pending scheduled action
   */
  private cancelNextTimer(): void {
    if (this.nextTimer !== null) {
      clearTimeout(this.nextTimer);
      this.nextTimer = null;
    }
  }
}
