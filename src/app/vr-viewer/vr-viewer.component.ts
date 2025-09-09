import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-vr-viewer',
  template: `
    <div #vrContainer class="vr-container">
      <div class="vr-info" *ngIf="!isInVR">
        <p>Click "Enter VR" to view the stereoscopic image in 3D</p>
        <button (click)="enterVR()" class="enter-vr-btn" *ngIf="vrSupported">Enter VR</button>
        <p class="no-vr-support" *ngIf="!vrSupported">VR not supported in this browser</p>
      </div>
    </div>
  `,
  styles: [`
    .vr-container {
      width: 100%;
      height: 100%;
      position: relative;
      background: #000;
    }

    .vr-info {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      z-index: 10;
    }

    .enter-vr-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 10px;
    }

    .enter-vr-btn:hover {
      background: #0056b3;
    }

    .no-vr-support {
      color: #ff6b6b;
      font-style: italic;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class VrViewerComponent implements OnInit, OnDestroy {
  @Input() imageUrl!: string;
  @Input() imageWidth!: number;
  @Input() imageHeight!: number;

  @ViewChild('vrContainer', { static: true }) vrContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private texture!: THREE.Texture;
  private material!: THREE.ShaderMaterial;
  private geometry!: THREE.PlaneGeometry;
  private mesh!: THREE.Mesh;

  public vrSupported = false;
  public isInVR = false;

  ngOnInit() {
    this.initVRSupport();
    this.initThreeJS();
  }

  ngOnDestroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.texture) {
      this.texture.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
  }

  private initVRSupport() {
    // Check if WebXR is supported
    if ('xr' in navigator) {
      this.vrSupported = true;
    } else {
      this.vrSupported = false;
    }
  }

  private initThreeJS() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.imageWidth / this.imageHeight,
      0.1,
      1000
    );
    this.camera.position.z = 1;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.imageWidth, this.imageHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.xr.enabled = true;

    // Load the stereoscopic image
    const loader = new THREE.TextureLoader();
    loader.load(
      this.imageUrl,
      (texture) => {
        this.texture = texture;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        // Create material with stereoscopic shader
        this.material = new THREE.ShaderMaterial({
          uniforms: {
            stereoscopicTexture: { value: this.texture },
            eyeSeparation: { value: 0.064 }, // 64mm eye separation
            focalLength: { value: 1.0 }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D stereoscopicTexture;
            uniform float eyeSeparation;
            uniform float focalLength;
            varying vec2 vUv;

            void main() {
              vec2 uv = vUv;

              // Determine which eye we're rendering for
              float eye = gl_FragCoord.x < (resolution.x * 0.5) ? -1.0 : 1.0;

              // Adjust UV coordinates based on eye separation
              float separation = eyeSeparation * eye / focalLength;
              uv.x += separation;

              // Sample the texture
              vec4 color = texture2D(stereoscopicTexture, uv);

              gl_FragColor = color;
            }
          `
        });

        // Create geometry (plane for the image)
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.scene.add(this.mesh);

        // Add renderer to DOM
        this.vrContainer.nativeElement.appendChild(this.renderer.domElement);

        // Start render loop
        this.animate();

        // Add VR button if supported
        if (this.vrSupported) {
          this.addVRButton();
        }
      },
      undefined,
      (error) => {
        console.error('Error loading stereoscopic image:', error);
      }
    );
  }

  private addVRButton() {
    // Use Three.js XRButton
    try {
      import('three/examples/jsm/webxr/XRButton.js').then(({ XRButton }) => {
        const button = XRButton.createButton(this.renderer);
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        this.vrContainer.nativeElement.appendChild(button);

        // Listen for VR session start/end
        this.renderer.xr.addEventListener('sessionstart', () => {
          this.isInVR = true;
        });

        this.renderer.xr.addEventListener('sessionend', () => {
          this.isInVR = false;
        });
      });
    } catch (error) {
      console.warn('XRButton not available:', error);
    }
  }

  private animate() {
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
  }

  public enterVR() {
    if (this.vrSupported && navigator.xr) {
      navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor']
      }).then((session) => {
        this.isInVR = true;
        // The XRButton will handle the session management
      }).catch((error) => {
        console.error('Failed to start VR session:', error);
      });
    }
  }
}
