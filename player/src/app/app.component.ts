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
  public videoContainerWidth?: string;

  public videoFiles: VideoFile[] = [
  ]

  constructor(private ngZone: NgZone) {
    this.updateVideoContainerWidth();
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
      duration: 0
    });
  }

  @HostListener('drop', ['$event'])
  public async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const typeChecker = <HTMLVideoElement>document.createElement('video');
    for (let i = 0; i < (event.dataTransfer?.files?.length||0); i++) {
      const file: File = <File>event.dataTransfer?.files[i];
      const path = (<any>file).path;
      console.log(path, typeof path);
      if (typeChecker.canPlayType(file.type) === '') {
        console.info(`can't play this file: ${path}`);
        continue;
      }
      const url = await window.electronAPI.pathToFileURL(path);
      console.log(url);
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
      this.updateVideoContainerWidth();
    }
  }

  @HostListener('window:resize', ['$event'])
  public onResizeWindow(event: any): void {
    this.updateVideoContainerWidth();
  }

  private updateVideoContainerWidth(): void {
    this.videoContainerWidth = (document.body.clientWidth / this.videoContainerCount - 1) + 'px';
  }

  public onLoadedMetadata(video: HTMLVideoElement, videoFile: VideoFile): void {
    videoFile.duration = video.duration;
  }
  public onChangeTimeSlider(slider: Slider, video: HTMLVideoElement, miniVideo: HTMLVideoElement, videoFile: VideoFile): void {
    if (!slider.dragging) {
      return;
    }
    // very slow...
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
}
