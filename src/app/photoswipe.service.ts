import { ApplicationRef, EnvironmentInjector, Injectable, createComponent } from '@angular/core';
import { HydrusBasicFile, FileCategory } from './hydrus-file';
import PhotoSwipe, { PhotoSwipeOptions, SlideData } from 'photoswipe';
import { Platform } from '@angular/cdk/platform';
import Content from 'photoswipe/dist/types/slide/content';
import Slide from 'photoswipe/dist/types/slide/slide';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { FileInfoSheetComponent } from './file-info-sheet/file-info-sheet.component';
import { Location } from '@angular/common';
import { HydrusFileDownloadService } from './hydrus-file-download.service';
import { take } from 'rxjs';
import { canOpenInPhotopea, getPhotopeaUrlForFile } from './photopea';
import { SettingsService } from './settings.service';
import { StereoMakerService } from './stereo-maker.service';
import { VrViewerComponent } from './vr-viewer/vr-viewer.component';
import { MatLegacyButton as MatButton } from '@angular/material/legacy-button';


function isContentType(content: Content | Slide, type: string) {
  return (content && content.data && content.data.type === type);
}

@Injectable({
  providedIn: 'root'
})
export class PhotoswipeService {

  constructor(
    public platform: Platform,
    private bottomSheet: MatBottomSheet,
    private location: Location,
    private downloadService: HydrusFileDownloadService,
    private settingsService: SettingsService,
    private stereoMakerService: StereoMakerService,
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector,

  ) { }

  private processedFiles = new Map<string, SlideData>();
  private stereoCache = new Map<string, Blob>();
  private stereoLoadingQueue: { file: HydrusBasicFile; priority: number }[] = [];
  private currentlyLoading = new Set<string>();

  openPhotoSwipe(items: HydrusBasicFile[], id: number) {
    const imgindex = items.findIndex(e => e.file_id === id);

    const options: PhotoSwipeOptions = {
      index: imgindex,
      bgOpacity: 1,
      clickToCloseNonZoomable: false,
      showHideAnimationType: 'none',
      arrowPrev: false,
      arrowNext: false,
      zoom: false,
      close: false,
      //secondaryZoomLevel: 1,
      maxZoomLevel: 2,
      //tapAction: null,
      errorMsg: 'The file cannot be loaded',
      trapFocus: false
    }

    const pswp = new PhotoSwipe(options);

    pswp.addFilter('numItems', numItems => {
      return items.length;
    })

    pswp.addFilter('itemData', (itemData, index) => {
      const file = items[index];
      if(this.processedFiles.has(file.hash)) {
        const cachedData = this.processedFiles.get(file.hash);
        return cachedData;
      }
      return this.getPhotoSwipeItem(items[index]);
    });

/*     pswp.addFilter('useContentPlaceholder', (useContentPlaceholder, content) => {
      if(isContentType(content, 'video')) {
        //return true;
      }
      return useContentPlaceholder;
    }); */

/*     const _getVerticalDragRatio = (panY) => {
      return (panY - pswp.currSlide.bounds.center.y)
              / (pswp.viewportSize.y / 3);
    } */

/*     pswp.on('verticalDrag', (e) => {
      // triggered when using vertical drag to close gesture
      // can be default prevented
      console.log('verticalDrag', e.panY);
      //pswp.element.classList.add('pswp--ui-visible')
      const drag = 1 - Math.abs(_getVerticalDragRatio(e.panY));
      console.log(drag);
      if(pswp.element.classList.contains('pswp--ui-visible') && drag < 0.95) {
        pswp.element.classList.remove('pswp--ui-visible')
      } else if (!pswp.element.classList.contains('pswp--ui-visible') && drag >= 0.95) {
        pswp.element.classList.add('pswp--ui-visible')
      }
    }); */


    pswp.on('wheel', (e) => {
      const event = e.originalEvent;
      if(event.ctrlKey) {
        return;
      }
      e.preventDefault();
      if (event.deltaY < 0) { // wheel up
        pswp.prev();
      } else if (event.deltaY > 0) { // wheel down
        pswp.next();
      }
    });

    pswp.on('tapAction', (e) => {
      if(!pswp.currSlide.content.isImageContent()) {
        e.preventDefault();
      }
    });

    pswp.on('bindEvents', () => {
      pswp.scrollWrap.onauxclick = (event: MouseEvent) => {
        if (event.button === 1) {
          pswp.close();
        }
      };

    });

    pswp.on('keydown', (e) => {
      if (this.bottomSheet._openedBottomSheetRef) {
        e.preventDefault();
      }
    });

    pswp.on('uiRegister', () => {
      pswp.ui.registerElement({
        name: 'info',
        order: 15,
        isButton: true,
        tagName: 'button',
        html: '<span class="mat-icon material-icons">info_outlined</span>',
        onClick: (event, el, pswp) => {
          const file = pswp.currSlide.data.file as HydrusBasicFile;
          this.bottomSheet.open(FileInfoSheetComponent, {
            data: {
              file
            },
            panelClass: 'file-info-panel',
            closeOnNavigation: true
          }).afterDismissed().pipe(take(1)).subscribe(res => {
            if(res) {
              pswp.close();
            }
          });
        }
      });

      pswp.ui.registerElement({
        name: 'custom-close',
        order: 20,
        isButton: true,
        tagName: 'button',
        html: '<span class="mat-icon material-icons">close</span>',
        onClick: 'close'
      });

      pswp.ui.registerElement({
        name: 'download',
        order: 13,
        isButton: true,
        tagName: 'button',
        html: '<span class="mat-icon material-icons">get_app</span>',
        onClick: (event, el, pswp) => {
          const file = pswp.currSlide.data.file as HydrusBasicFile;
          this.downloadService.saveFile(file);
        }
      });

      if(this.downloadService.canShare) {
        pswp.ui.registerElement({
          name: 'share',
          order: 14,
          isButton: true,
          tagName: 'button',
          html: '<span class="mat-icon material-icons">share</span>',
          onClick: (event, el, pswp) => {
            const file = pswp.currSlide.data.file as HydrusBasicFile;
            this.downloadService.shareFile(file);
          }
        });
      }

      pswp.ui.registerElement({
        name: 'zoom-level-indicator',
        order: 6,
        className: 'pswp__zoom-level',
        onInit: (el, pswp) => {
          pswp.on('zoomPanUpdate', (e) => {
            if (e.slide === pswp.currSlide) {
              if(pswp.currSlide.isZoomable()) {
                const pixelRatioZoom = window.devicePixelRatio && window.devicePixelRatio === 1 ? '' :
                  ` (${Math.round(pswp.currSlide.currZoomLevel * window.devicePixelRatio * 100)}%)`;
                el.innerText = `${Math.round(pswp.currSlide.currZoomLevel * 100)}%${pixelRatioZoom}`;
              } else {
                el.innerText = '';
              }

            }
          });
        }
      });
    });

    pswp.addFilter('uiElement', (element, data) => {
      return element;
    });



    pswp.on('contentLoad', (e) => {
      const { content, isLazy } = e;
      const file = content.data.file as HydrusBasicFile;

      if(isContentType(content, 'vr-image')) {
        e.preventDefault();
        content.state = 'loading';

        const cachedBlob = this.stereoCache.get(file.hash);
        if (cachedBlob) {
          // Use cached VR image
          this.displayCachedVrImage(content, file, cachedBlob);
        } else {
          // Generate immediately for display (force immediate processing)
          this.generateAndCacheVrImage(content, file);
        }
      } else if(isContentType(content, 'stereo-image')) {
        e.preventDefault();
        content.state = 'loading';

        const cachedBlob = this.stereoCache.get(file.hash);
        if (cachedBlob) {
          // Use cached stereo image
          this.displayCachedStereoImage(content, file, cachedBlob);
        } else {
          // Generate immediately for display (force immediate processing)
          this.generateAndCacheStereoImage(content, file);
        }
      } else if(isContentType(content, 'video')) {
        e.preventDefault();

        content.state = 'loading';

        content.element = document.createElement('div');
        content.element.className = 'pswp-video-container';
        const img = document.createElement('img');
        img.src = file.thumbnail_url;
        img.className = 'pswp-video-placeholder'
        content.element.append(img);
      } else if(isContentType(content, 'audio')) {
        e.preventDefault();

        content.state = 'loading';

        content.element = document.createElement('div');
        content.element.className = 'pswp-audio-container';
      } else if (isContentType(content, 'renderable')) {
        e.preventDefault();
        content.element = document.createElement('div');
        content.element.className = 'pswp__content pswp__error-msg-container';

        const errorMsgEl = document.createElement('div');
        errorMsgEl.className = 'pswp__error-msg';
        content.element.appendChild(errorMsgEl);

        const img = document.createElement('img');
        img.src = file.thumbnail_url;
        img.className = 'pswp-error-thumb';
        errorMsgEl.appendChild(img);

        const errorMsgText = document.createElement('div');
        errorMsgText.innerText = `Unsupported Filetype (${file.file_type_string})`;
        errorMsgText.className = 'pswp-error-text';
        errorMsgEl.appendChild(errorMsgText);

        const renderButton = document.createElement('button');
        renderButton.setAttribute('mat-raised-button', '');
        const psdButtonComponent = createComponent(MatButton, {
          environmentInjector: this.injector,
          hostElement: renderButton,
          projectableNodes: [
            [document.createTextNode('Load render from Hydrus')]
          ]
        })

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'pswp-error-text';
        errorMsgEl.appendChild(buttonContainer);
        buttonContainer.appendChild(renderButton);
        this.appRef.attachView(psdButtonComponent.hostView);

        renderButton.addEventListener('click', async (ev) => {
          psdButtonComponent.setInput('disabled', true);
          const data = {
            type: 'image',
            src: file.render_url,
            msrc: file.thumbnail_url,
            width: file.width,
            height: file.height,
            file
          }
          this.processedFiles.set(file.hash, data);
          pswp.refreshSlideContent(content.index);
        })

        this.addPhotopeaButton(file, errorMsgEl);


      } else if (isContentType(content, 'unsupported')) {
        e.preventDefault();
        content.element = document.createElement('div');
        content.element.className = 'pswp__content pswp__error-msg-container';

        const errorMsgEl = document.createElement('div');
        errorMsgEl.className = 'pswp__error-msg';
        content.element.appendChild(errorMsgEl);

        const img = document.createElement('img');
        img.src = file.thumbnail_url;
        img.className = 'pswp-error-thumb';
        errorMsgEl.appendChild(img);

        const errorMsgText = document.createElement('div');
        errorMsgText.innerText = `Unsupported Filetype (${file.file_type_string})`;
        errorMsgText.className = 'pswp-error-text';
        errorMsgEl.appendChild(errorMsgText);

        this.addPhotopeaButton(file, errorMsgEl);

      }

    });

    // Queue adjacent images when slide changes
    pswp.on('change', () => {
      const currentIndex = pswp.currIndex;
      this.queueAdjacentImages(items, currentIndex, false); // Not initial load
    });

    // Queue initial adjacent images when PhotoSwipe opens
    pswp.on('firstUpdate', () => {
      const currentIndex = pswp.currIndex;
      this.queueAdjacentImages(items, currentIndex, true); // Initial load
    });

    pswp.on('contentActivate', ({content}) => {
      if (isContentType(content, 'video') && content.element) {
        const file = content.data.file as HydrusBasicFile;
        const vid = document.createElement('video');
        vid.src = file.file_url;
        vid.autoplay = this.settingsService.appSettings.mediaAutoplay;
        vid.controls = !this.platform.FIREFOX;
        vid.poster = file.thumbnail_url;
        vid.loop = this.settingsService.appSettings.mediaLoop;
        vid.muted = this.settingsService.appSettings.mediaDefaultMuted;
        vid.className = 'pswp-video pswp-media';
        vid.onloadeddata = (e) => {
          content.onLoaded();
        }
        vid.onerror = (e) => {
          content.onError();
        }
        content.element.prepend(vid);
      } else if (isContentType(content, 'audio') && content.element) {
        const file = content.data.file as HydrusBasicFile;
        const audio = document.createElement('audio');
        audio.src = file.file_url;
        audio.autoplay = this.settingsService.appSettings.mediaAutoplay;
        audio.loop = this.settingsService.appSettings.mediaLoop;
        audio.muted = this.settingsService.appSettings.mediaDefaultMuted;
        audio.controls = true;
        audio.className = 'pswp-audio pswp-media';
        audio.onloadeddata = (e) => {
          content.onLoaded();
        }
        audio.onerror = (e) => {
          content.onError();
        }
        content.element.prepend(audio);
      }
    });

    pswp.addFilter('contentErrorElement', (contentErrorElement, content) => {

      const file = content.data.file as HydrusBasicFile;

      const errorMsgEl = document.createElement('div');
      errorMsgEl.className = 'pswp__error-msg';
      content.element.appendChild(errorMsgEl);

      const img = document.createElement('img');
      img.src = file.thumbnail_url;
      img.className = 'pswp-error-thumb';
      errorMsgEl.appendChild(img);

      const errorMsgText = document.createElement('div');
      errorMsgText.innerText = `The file cannot be loaded (${file.file_type_string})`;
      errorMsgText.className = 'pswp-error-text';
      errorMsgEl.appendChild(errorMsgText);

      return errorMsgEl;
    });

    pswp.on('appendHeavy', (e) => {

    });

    pswp.on('contentAppend', (e) => {

    });

    const handleDestroyMedia = (content: Content) => {
      if ((isContentType(content, 'video') || isContentType(content, 'audio')) && content.element) {
        content.element.querySelectorAll<HTMLMediaElement>('.pswp-media').forEach(media => {
          media.pause();
          media.removeAttribute('src');
          media.load();
          media.remove();
        })
      }

      // Clean up stereo image blob URLs
      if (isContentType(content, 'stereo-image') && content.data?.stereoBlobUrl) {
        URL.revokeObjectURL(content.data.stereoBlobUrl);
      }

      // Clean up VR image blob URLs and components
      if (isContentType(content, 'vr-image')) {
        if (content.data?.vrBlobUrl) {
          URL.revokeObjectURL(content.data.vrBlobUrl);
        }
        if (content.data?.vrComponent) {
          content.data.vrComponent.destroy();
        }
      }
    }

    pswp.on('contentDeactivate', ({content}) => {
      handleDestroyMedia(content);
    });

    pswp.on('contentRemove', ({content}) => {
      handleDestroyMedia(content);
    });

    /* pswp.on('contentDestroy', ({content}) => {

    }); */

    const locSub = this.location.subscribe(e => {
      pswp.close();
    });

    pswp.on('close', () => {
      locSub.unsubscribe();
      if(window.history.state.pswp) {
        window.history.back();
      }
    });

    /* pswp.on('destroy', () => {

    }); */

    //this.location.go(this.location.path() + '#pswp');
    window.history.pushState({pswp: true}, '');

    pswp.init();
  }



  getPhotoSwipeItem(file: HydrusBasicFile): SlideData {

    switch(file.file_category) {
      case FileCategory.Image: {
        // Check if VR mode is enabled and file is supported (takes priority over stereo)
        if (this.settingsService.appSettings.vrMode && this.stereoMakerService.isFileSupported(file)) {
          return {
            src: 'vr-placeholder', // Will be replaced with actual blob URL during contentLoad
            msrc: file.thumbnail_url,
            width: file.width,
            height: file.height,
            file,
            type: 'vr-image'
          };
        }
        // Check if stereo mode is enabled and file is supported
        else if (this.settingsService.appSettings.stereoMode && this.stereoMakerService.isFileSupported(file)) {
          return {
            src: 'stereo-placeholder', // Will be replaced with actual blob URL during contentLoad
            msrc: file.thumbnail_url,
            width: file.width * 2, // Stereo images are side-by-side, so double width
            height: file.height,
            file,
            type: 'stereo-image'
          };
        } else {
          return {
            src: file.file_url,
            msrc: file.thumbnail_url,
            width: file.width,
            height: file.height,
            file
          };
        }
      }
      case FileCategory.Video: {
        return {
          file,
          type: 'video',
        };
      }
      case FileCategory.Audio: {
        return {
          file,
          type: 'audio'
        };
      }
      case FileCategory.Renderable: {
        return {
          file,
          type: 'renderable',
          width: file.width,
          height: file.height
        };
      }
      default: {
        return {
          type: 'unsupported',
          file
        };
      }
    }
  }

  addPhotopeaButton(file: HydrusBasicFile, element: HTMLElement) {
    if(canOpenInPhotopea(file) && this.settingsService.appSettings.photopeaIntegration) {
      const photopeaButton = document.createElement('a');
      photopeaButton.setAttribute('mat-raised-button', '');
      photopeaButton.target = '_blank';
      photopeaButton.href = getPhotopeaUrlForFile(file);

      const photopeaButtonComponent = createComponent(MatButton, {
        environmentInjector: this.injector,
        hostElement: photopeaButton,
        projectableNodes: [
          [document.createTextNode('Open file in Photopea')]
        ]
      })

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'pswp-error-text';
      element.appendChild(buttonContainer);
      buttonContainer.appendChild(photopeaButton);

      this.appRef.attachView(photopeaButtonComponent.hostView);
    }
  }

  /**
   * Display a cached stereo image
   */
  private displayCachedStereoImage(content: Content, file: HydrusBasicFile, blob: Blob) {
    const stereoUrl = URL.createObjectURL(blob);

    // Create the image element that PhotoSwipe will display
    const img = new Image();
    img.src = stereoUrl;
    img.className = 'stereo-image';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';

    // Create container element with proper sizing for stereo image
    content.element = document.createElement('div');
    content.element.className = 'pswp__img-container';
    content.element.style.width = '100%';
    content.element.style.height = '100%';
    content.element.style.display = 'flex';
    content.element.style.alignItems = 'center';
    content.element.style.justifyContent = 'center';
    content.element.style.backgroundColor = '#000';
    content.element.appendChild(img);

    // Update content data
    content.data.src = stereoUrl;
    content.state = 'loaded';

    img.onload = () => {
      content.onLoaded();
    };
    img.onerror = () => {
      // If cached image fails to load, try regenerating
      this.stereoCache.delete(file.hash);
      this.generateAndCacheStereoImage(content, file);
    };

    // Store the blob URL for cleanup
    content.data.stereoBlobUrl = stereoUrl;
  }

  /**
   * Generate and cache a new stereo image
   */
  private generateAndCacheStereoImage(content: Content, file: HydrusBasicFile) {
    // Check cache first
    const cachedBlob = this.stereoCache.get(file.hash);
    if (cachedBlob) {
      this.displayCachedStereoImage(content, file, cachedBlob);
      return;
    }

    this.stereoMakerService.generateStereoImage(file).subscribe({
      next: (blob) => {
        // Cache the blob for future use
        this.stereoCache.set(file.hash, blob);

        // Display the generated image
        this.displayCachedStereoImage(content, file, blob);
      },
      error: (error) => {
        content.state = 'error';
        content.onError();
      }
    });
  }

  /**
   * Display a cached VR image
   */
  private displayCachedVrImage(content: Content, file: HydrusBasicFile, blob: Blob) {
    const vrUrl = URL.createObjectURL(blob);

    // Create VR viewer container
    content.element = document.createElement('div');
    content.element.className = 'pswp__vr-container';
    content.element.style.width = '100%';
    content.element.style.height = '100%';
    content.element.style.position = 'relative';
    content.element.style.overflow = 'hidden';

    // Create VR viewer component using Angular's component factory
    const vrViewer = createComponent(VrViewerComponent, {
      environmentInjector: this.injector,
      hostElement: document.createElement('app-vr-viewer')
    });

    // Set component inputs
    vrViewer.setInput('imageUrl', vrUrl);
    vrViewer.setInput('imageWidth', file.width);
    vrViewer.setInput('imageHeight', file.height);

    // Attach the component to the DOM
    content.element.appendChild(vrViewer.location.nativeElement);
    this.appRef.attachView(vrViewer.hostView);

    // Update content data
    content.data.src = vrUrl;
    content.state = 'loaded';

    // Store the blob URL and component reference for cleanup
    content.data.vrBlobUrl = vrUrl;
    content.data.vrComponent = vrViewer;
  }

  /**
   * Generate and cache a new VR image
   */
  private generateAndCacheVrImage(content: Content, file: HydrusBasicFile) {
    // Check cache first
    const cachedBlob = this.stereoCache.get(file.hash);
    if (cachedBlob) {
      this.displayCachedVrImage(content, file, cachedBlob);
      return;
    }

    this.stereoMakerService.generateStereoImage(file).subscribe({
      next: (blob) => {
        // Cache the blob for future use
        this.stereoCache.set(file.hash, blob);

        // Display the generated VR image
        this.displayCachedVrImage(content, file, blob);
      },
      error: (error) => {
        content.state = 'error';
        content.onError();
      }
    });
  }

  /**
   * Queue stereo image generation with priority
   */
  private queueStereoGeneration(file: HydrusBasicFile, priority: number = 0, forceImmediate: boolean = false) {
    // Skip if already cached
    if (this.stereoCache.has(file.hash)) {
      return;
    }

    // Check if file is supported
    if (!this.stereoMakerService.isFileSupported(file)) {
      return;
    }

    // If this is a high priority request (priority 0) or force immediate, process immediately
    if (priority === 0 || forceImmediate) {
      this.processImmediately(file);
      return;
    }

    // Skip if already in queue or currently loading
    if (this.currentlyLoading.has(file.hash) ||
        this.stereoLoadingQueue.some(item => item.file.hash === file.hash)) {
      return;
    }

    // Add to queue with priority
    this.stereoLoadingQueue.push({ file, priority });

    // Sort by priority (lower number = higher priority)
    this.stereoLoadingQueue.sort((a, b) => a.priority - b.priority);

    // Start processing if not already doing so
    this.processQueue();
  }

  /**
   * Process stereo generation immediately (for current/high priority images)
   */
  private processImmediately(file: HydrusBasicFile) {
    // Skip if already cached or currently loading
    if (this.stereoCache.has(file.hash) || this.currentlyLoading.has(file.hash)) {
      return;
    }

    // Cancel any queued request for this file
    this.stereoLoadingQueue = this.stereoLoadingQueue.filter(item => item.file.hash !== file.hash);

    this.currentlyLoading.add(file.hash);

    // Generate stereo image immediately
    this.stereoMakerService.generateStereoImage(file).subscribe({
      next: (blob) => {
        // Cache the blob
        this.stereoCache.set(file.hash, blob);
        this.currentlyLoading.delete(file.hash);

        // Process next item in queue
        this.processQueue();
      },
      error: (error) => {
        console.error('Failed to generate stereo image immediately for file:', file.hash);
        this.currentlyLoading.delete(file.hash);

        // Process next item in queue even on error
        this.processQueue();
      }
    });
  }

  /**
   * Process the stereo loading queue
   */
  private processQueue() {
    // If already processing max concurrent requests, return
    if (this.currentlyLoading.size >= 1) { // Allow only 1 concurrent request
      return;
    }

    // Find next item to process
    const nextItem = this.stereoLoadingQueue.shift();
    if (!nextItem) {
      return;
    }

    const { file } = nextItem;
    this.currentlyLoading.add(file.hash);

    // Generate stereo image
    this.stereoMakerService.generateStereoImage(file).subscribe({
      next: (blob) => {
        // Cache the blob
        this.stereoCache.set(file.hash, blob);
        this.currentlyLoading.delete(file.hash);

        // Process next item in queue
        this.processQueue();
      },
      error: (error) => {
        console.error('Failed to generate stereo image for queued file:', file.hash);
        this.currentlyLoading.delete(file.hash);

        // Process next item in queue even on error
        this.processQueue();
      }
    });
  }

  /**
   * Clear the stereo/VR image cache
   */
  clearStereoCache() {
    this.stereoCache.forEach(blob => {
      // Note: We don't revoke blob URLs here as they might still be in use
      // The browser will clean them up when they are no longer referenced
    });
    this.stereoCache.clear();
    this.stereoLoadingQueue = [];
    this.currentlyLoading.clear();
  }

  /**
   * Queue adjacent images with proper priorities
   */
  private queueAdjacentImages(items: HydrusBasicFile[], currentIndex: number, isInitialLoad: boolean = false) {
    const totalItems = items.length;

    // For initial load, prioritize current image and immediate neighbors
    if (isInitialLoad) {
      // First, queue the current image with highest priority (this will be processed immediately)
      const currentFile = items[currentIndex];
      if (this.isStereoOrVrImage(currentFile)) {
        this.queueStereoGeneration(currentFile, 0, true); // Force immediate processing
      }

      // Queue only the immediate next and previous images
      // Next image (priority 1)
      const nextIndex = (currentIndex + 1) % totalItems;
      const nextFile = items[nextIndex];
      if (this.isStereoOrVrImage(nextFile)) {
        this.queueStereoGeneration(nextFile, 1);
      }

      // Previous image (priority 2)
      const prevIndex = (currentIndex - 1 + totalItems) % totalItems;
      const prevFile = items[prevIndex];
      if (this.isStereoOrVrImage(prevFile)) {
        this.queueStereoGeneration(prevFile, 2);
      }
    } else {
      // For slide changes, only queue the new adjacent images that might not be cached
      // Next image (priority 1)
      const nextIndex = (currentIndex + 1) % totalItems;
      const nextFile = items[nextIndex];
      if (this.isStereoOrVrImage(nextFile)) {
        this.queueStereoGeneration(nextFile, 1);
      }

      // Previous image (priority 2)
      const prevIndex = (currentIndex - 1 + totalItems) % totalItems;
      const prevFile = items[prevIndex];
      if (this.isStereoOrVrImage(prevFile)) {
        this.queueStereoGeneration(prevFile, 2);
      }
    }
  }

  /**
   * Check if file is a stereo or VR image that needs processing
   */
  private isStereoOrVrImage(file: HydrusBasicFile): boolean {
    if (!this.stereoMakerService.isFileSupported(file)) {
      return false;
    }

    const settings = this.settingsService.appSettings;
    return (settings.stereoMode && this.stereoMakerService.isFileSupported(file)) ||
           (settings.vrMode && this.stereoMakerService.isFileSupported(file));
  }

  /**
   * Get cache statistics
   */
  getStereoCacheStats() {
    let totalSize = 0;
    this.stereoCache.forEach(blob => {
      totalSize += blob.size;
    });

    return {
      itemCount: this.stereoCache.size,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      queueLength: this.stereoLoadingQueue.length,
      currentlyLoading: this.currentlyLoading.size
    };
  }

}
