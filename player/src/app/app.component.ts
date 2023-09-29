import { Component, HostListener, NgZone, OnInit } from '@angular/core';
import { Slider } from 'primeng/slider';

declare var window: {
  electronAPI: {
    pathToFileURL: (path: string) => Promise<string>;
  };
}

interface VideoFile {
  url: string;
  currentTime: number;
  duration: number;
  playing: boolean;
  is169: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public videoContainerCount = 3; // px
  private readonly VIDEO_CONTAINER_COUNT_MIN = 1;
  private readonly VIDEO_CONTAINER_COUNT_MAX = 10;
  private readonly VIDEO_CONTAINER_COUNT_STEP = 1;

  public clientWidth?: number;
  public videoContainerWidth?: string;
  public videoContainerHeight?: string;
  public videoWidth?: string;
  public videoHeight?: string;

  public videoFiles: VideoFile[] = [];
  public getAllRowNumberArray(): number[] {
    const nRow = Math.ceil(this.videoFiles.length / this.videoContainerCount);
    const result: number[] = [];
    for (let i = 0; i < nRow; i++) {
      result.push(i);
    }
    return result;
  }
  public getVideoFiles(row: number): VideoFile[] {
    const start = row * this.videoContainerCount;
    const end = start + this.videoContainerCount;
    return this.videoFiles.slice(start, end);
  }

  constructor(private ngZone: NgZone) {
    this.resizeVideoContainer();
  }

  ngOnInit(): void {
  }

  @HostListener('dragover', ['$event'])
  public onDragover(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private addNewVideoFile(url: string): void {
    this.videoFiles.push({
      url: url,
      currentTime: 0,
      duration: 0,
      playing: false,
      is169: true,
    });
  }

  @HostListener('drop', ['$event'])
  public async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer?.files) {
      return;
    }

    // 'await' will invalidate the contents of dataTransfer.
    // Retrieve the required information (path, type) in advance.
    const paths: string[] = [];
    const typeChecker = <HTMLVideoElement>document.createElement('video');
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file: File = <File>event.dataTransfer?.files[i];
      const path = (<any>file).path;
      if (typeChecker.canPlayType(file.type) === '') {
        console.info(`can't play this file: ${path}`);
        continue;
      }
      paths.push(path);
    }

    for (let path of paths) {
      const url = await window.electronAPI.pathToFileURL(path);
      this.addNewVideoFile(url);
    }
  }

  @HostListener('wheel', ['$event'])
  public onMouseWheel(event: WheelEvent): void {
    if (event.ctrlKey) {
      if (event.deltaY > 0) {
        this.videoContainerCount = Math.max(
          this.VIDEO_CONTAINER_COUNT_MIN, this.videoContainerCount - this.VIDEO_CONTAINER_COUNT_STEP);
      } else if (event.deltaY < 0) {
        this.videoContainerCount = Math.min(
          this.VIDEO_CONTAINER_COUNT_MAX, this.videoContainerCount + this.VIDEO_CONTAINER_COUNT_STEP);
      }
      this.resizeVideoContainer();
    }
  }

  @HostListener('window:resize', ['$event'])
  public onResizeWindow(event: any): void {
    this.resizeVideoContainer();
  }

  private resizeVideoContainer(): void {
    this.clientWidth = document.body.clientWidth;
    const width = this.clientWidth / this.videoContainerCount;
    const height = (width / 16) * 9;

    // To be an integer value for accurate drawing.
    this.videoContainerWidth = Math.floor(width) + 'px';
    this.videoContainerHeight = Math.floor(height) + 'px';

    // To fill the 1px gap between containers
    // (Cause of the gap is unknown)
    this.videoWidth = Math.floor(width + 1) + 'px';
    this.videoHeight = Math.floor(height + 1) + 'px';
  }
  public getVideoContainerWidth(isLast: boolean): string {
    if (!isLast) {
      return <string>this.videoContainerWidth;
    }

    // Add margins to the last container.
    const width = Math.floor(<number>this.clientWidth / this.videoContainerCount);
    return (width + (<number>this.clientWidth - width * this.videoContainerCount)) + 'px';
  }
  public getVideoWidth(isLast: boolean): string {
    if (!isLast) {
      return <string>this.videoWidth;
    }

    // Add margins to the last container.
    const width = Math.floor(<number>this.clientWidth / this.videoContainerCount);
    return (width + (<number>this.clientWidth - width * this.videoContainerCount) + 1) + 'px';
  }

  public onLoadedMetadata(video: HTMLVideoElement, videoFile: VideoFile): void {
    videoFile.duration = video.duration;
    videoFile.is169 = (video.videoWidth / 16) == (video.videoHeight / 9);

    // Recovery of currentTime when recreating the DOM.
    video.currentTime = videoFile.currentTime;
  }
  public onChangeTimeSlider(slider: Slider, video: HTMLVideoElement, miniVideo: HTMLVideoElement, videoFile: VideoFile): void {
    if (!slider.dragging) {
      return;
    }
    // very slow...? currentTime are not reflected immediately.
    miniVideo.currentTime = videoFile.currentTime;
  }
  public onTimeSlideEnd(slider: Slider, video: HTMLVideoElement, miniVideo: HTMLVideoElement, videoFile: VideoFile): void {
    video.currentTime = videoFile.currentTime;
  }
  public onVideoTimeUpdate(slider: Slider, video: HTMLVideoElement, videoFile: VideoFile): void {
    if (slider.dragging) {
      return;
    }
    videoFile.currentTime = video.currentTime;
  }
  public getHHMMSS(duration: number): string {
    duration = Math.floor(duration);
    const hour = Math.floor(duration / 3600);
    const min = Math.floor((duration % 3600) / 60);
    const sec = (duration % 3600) % 60;
    return `0${hour}`.slice(-2) + ':' + `0${min}`.slice(-2) + ':' + `0${sec}`.slice(-2);
  }
}
