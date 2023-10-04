import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Slider } from 'primeng/slider';

declare var window: {
  electronAPI: {
    pathToFileURL: (path: string) => Promise<string>;
  };
}

interface VideoFile {
  url: string;
  previousTime: number;
  currentTime: number;
  duration: number;
  playing: boolean;
  is169: boolean;
  loop: boolean;
  error: boolean;
  range: number[]
}

interface PlayerStatus {
  videoContainerCount: number;
  videoFiles: VideoFile[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private readonly STORAGE_KEY_PLAYER_STATUS = 'player-status-0.0.0';

  public videoContainerCount = 3;
  private readonly VIDEO_CONTAINER_COUNT_MIN = 1;
  private readonly VIDEO_CONTAINER_COUNT_MAX = 10;
  private readonly VIDEO_CONTAINER_COUNT_STEP = 1;

  public clientWidth?: number;

  public videoFiles: VideoFile[] = [];
  public videoContainerWidth?: string;
  public videoContainerHeight?: string;
  public videoWidth?: string;
  public videoHeight?: string;

  @ViewChildren('video') videoQuery?: QueryList<ElementRef<HTMLVideoElement>>;

  constructor(private titleService: Title) {
    this.loadPlayerStatus();
    this.resizeVideoContainer();
    this.updateTitle();
  }

  ngOnInit(): void {
  }

  private getDefaultPlayerStatus(): PlayerStatus {
    return {
      videoContainerCount: 3,
      videoFiles: [],
    };
  }

  private loadPlayerStatus(): void {
    let status: PlayerStatus;
    const value = localStorage.getItem(this.STORAGE_KEY_PLAYER_STATUS);
    if (value) {
      try {
        status = JSON.parse(value);
      } catch(e) {
        status = this.getDefaultPlayerStatus();
      }
    } else {
      status = this.getDefaultPlayerStatus();
    }

    this.videoContainerCount = status.videoContainerCount;
    this.videoFiles = status.videoFiles;
    this.videoFiles.forEach(i => {
      i.playing = false; // Stop at start-up.
      if (!i.range) {
        i.range = [0, 0];
      }
    });
  }

  private savePlayerStatus(): void {
    const status: PlayerStatus = {
      videoContainerCount: this.videoContainerCount,
      videoFiles: this.videoFiles
    };
    localStorage.setItem(this.STORAGE_KEY_PLAYER_STATUS, JSON.stringify(status));
  }

  @HostListener('dragover', ['$event'])
  public onDragover(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private addNewVideoFile(url: string): void {
    this.videoFiles.push({
      url: url,
      previousTime: 0,
      currentTime: 0,
      duration: 0,
      playing: false,
      is169: true,
      loop: true,
      error: false,
      range: [0, 0]
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
    this.savePlayerStatus();
    this.updateTitle();
  }

  @HostListener('wheel', ['$event'])
  public onMouseWheel(event: WheelEvent): void {
    if (event.ctrlKey) {
      if (event.deltaY < 0) {
        this.videoContainerCount = Math.max(
          this.VIDEO_CONTAINER_COUNT_MIN, this.videoContainerCount - this.VIDEO_CONTAINER_COUNT_STEP);
      } else if (event.deltaY > 0) {
        this.videoContainerCount = Math.min(
          this.VIDEO_CONTAINER_COUNT_MAX, this.videoContainerCount + this.VIDEO_CONTAINER_COUNT_STEP);
      }
      this.resizeVideoContainer();
      this.savePlayerStatus();
    }
  }

  @HostListener('window:resize', ['$event'])
  public onResizeWindow(event: any): void {
    this.resizeVideoContainer();
  }

  @HostListener('window:keydown.space', ['$event'])
  public onKeydownSpace(event: any): void {
    const playing = this.videoQuery?.filter(video => !video.nativeElement.paused).length;
    const canPlay = this.videoQuery?.filter(video => !video.nativeElement.error).length;
    const allPlaying = canPlay == playing;
    this.videoQuery?.forEach(video => {
      if (allPlaying) {
        video.nativeElement.pause();
      } else if (video.nativeElement.paused) {
        video.nativeElement.play();
      }
    });
  }

  public getVideoFiles(row: number): VideoFile[] {
    const start = row * this.videoContainerCount;
    const end = start + this.videoContainerCount;
    return this.videoFiles.slice(start, end);
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

  public onLoadedMetadata(video: HTMLVideoElement, videoFile: VideoFile): void {
    videoFile.duration = Math.ceil(video.duration * 100);
    videoFile.is169 = (video.videoWidth / 16) == (video.videoHeight / 9);
    if (videoFile.range[0] === 0 && videoFile.range[1] === 0) {
      videoFile.range = [0, videoFile.duration];
    }

    // Recovery of currentTime, etc. when recreating the DOM.
    video.currentTime = videoFile.currentTime / 100;
  }

  public onChangeTimeSlider(slider: Slider, video: HTMLVideoElement, miniVideo: HTMLVideoElement, videoFile: VideoFile): void {
    if (!slider.dragging) {
      return;
    }
    // very slow...? currentTime are not reflected immediately.
    miniVideo.currentTime = videoFile.currentTime / 100;
    if (!video.paused) {
      videoFile.previousTime = videoFile.currentTime;
    }
  }

  public onChangeTimeRange(slider: Slider, miniVideo: HTMLVideoElement, videoFile: VideoFile): void {
    miniVideo.currentTime = videoFile.range[slider.handleIndex] / 100;
    this.savePlayerStatus();
  }

  public onTimeSlideEnd(slider: Slider, video: HTMLVideoElement, miniVideo: HTMLVideoElement, videoFile: VideoFile): void {
    video.currentTime = videoFile.currentTime / 100;
    if (!video.paused) {
      videoFile.previousTime = videoFile.currentTime;
    }
  }

  public onVideoTimeUpdate(slider: Slider, video: HTMLVideoElement, videoFile: VideoFile): void {
    if (slider.dragging) {
      return;
    }
    videoFile.currentTime = Math.ceil(video.currentTime * 100);
    if (!video.paused) {
      if (videoFile.currentTime === videoFile.range[1] ||
          (videoFile.previousTime < videoFile.range[1] && videoFile.currentTime > videoFile.range[1])) {
        if (videoFile.loop) {
          videoFile.currentTime = videoFile.range[0];
          video.currentTime = videoFile.currentTime / 100;
        } else {
          video.pause();
        }
      }
      videoFile.previousTime = videoFile.currentTime;
    }
  }

  public getHHMMSS(duration: number): string {
    duration = Math.floor(duration);
    const hour = Math.floor(duration / 3600);
    const min = Math.floor((duration % 3600) / 60);
    const sec = (duration % 3600) % 60;
    return `0${hour}`.slice(-2) + ':' + `0${min}`.slice(-2) + ':' + `0${sec}`.slice(-2);
  }

  public onClockRemoveButton(event: any, videoFile: VideoFile): void {
    event.preventDefault();
    event.stopPropagation();
    this.videoFiles = this.videoFiles.filter(i => i !== videoFile);
    this.savePlayerStatus();
    this.updateTitle();
  }

  public updateTitle(): void {
    let title = 'FlexPlayer';
    if (this.videoFiles.length > 0) {
      const playing = this.videoFiles.filter(i => i.playing).length;
      const error = this.videoFiles.filter(i => i.error).length;
      title += `: ${playing} playing, ${this.videoFiles.length - playing - error} paused.`;
    }
    this.titleService.setTitle(title);
  }

  public onClickPlay(video: HTMLVideoElement, videoFile: VideoFile): void {
    if (videoFile.currentTime === videoFile.duration) {
      videoFile.currentTime = videoFile.range[0];
      video.currentTime = videoFile.range[0] / 100;
    }
    video.play();
  }

  public onVideoEnded(video: HTMLVideoElement, videoFile: VideoFile): void {
    if (!videoFile.loop) {
      videoFile.playing = false;
      this.updateTitle();
    } else {
      videoFile.currentTime = videoFile.range[0];
      video.currentTime = videoFile.range[0] / 100;
      video.play();
    }
  }
}
