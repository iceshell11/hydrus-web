import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-webxr',
  templateUrl: './webxr.component.html',
  styleUrls: ['./webxr.component.scss']
})
export class WebxrComponent implements OnInit, OnDestroy {
  @ViewChild('webxrContainer', { static: true }) webxrContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private cube!: THREE.Mesh;
  private xrSession: any = null;

  public vrSupported = false;
  public arSupported = false;
  public isInXR = false;

  async ngOnInit() {
    await this.initXRSupport();
    this.initThreeJS();
  }

  ngOnDestroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }
    if (this.xrSession) {
      this.xrSession.end();
    }
  }

  private async initXRSupport() {
    if ('xr' in navigator) {
      console.log('WebXR API detected');
      try {
        this.vrSupported = await (navigator as any).xr.isSessionSupported('immersive-vr');
        console.log('VR supported:', this.vrSupported);
      } catch (error: any) {
        console.error('Error checking VR support:', error);
        this.vrSupported = false;
      }

      try {
        this.arSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
        console.log('AR supported:', this.arSupported);
      } catch (error: any) {
        console.error('Error checking AR support:', error);
        this.arSupported = false;
      }
    } else {
      console.warn('WebXR API not available');
      this.vrSupported = false;
      this.arSupported = false;
    }
  }

  private initThreeJS() {
    console.log('Initializing Three.js scene');
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);

    // Camera setup for XR - position it appropriately for VR/AR
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 0); // Eye level height for VR
    console.log('Camera positioned at:', this.camera.position);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.xr.enabled = true;
    console.log('XR enabled:', this.renderer.xr.enabled);

    // Create blue cube - position it in front of the camera
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x0088ff });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.set(0, 0, -3); // Position in front of camera
    this.scene.add(this.cube);
    console.log('Cube created and added to scene at position:', this.cube.position);

    // Add some lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Add renderer to DOM
    this.webxrContainer.nativeElement.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start render loop
    this.animate();

    // Add XR buttons
    this.addXRButtons();
  }

  private addXRButtons() {
    if (this.vrSupported) {
      this.addVRButton();
    }
    if (this.arSupported) {
      this.addARButton();
    }
  }

  private addVRButton() {
    console.log('Adding VR button, vrSupported:', this.vrSupported);
    try {
      import('three/examples/jsm/webxr/XRButton.js').then(({ XRButton }) => {
        console.log('XRButton loaded, creating VR button');
        const button = XRButton.createButton(this.renderer);
        console.log('VR button created:', button);
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        this.webxrContainer.nativeElement.appendChild(button);
        console.log('VR button added to container');

        // Listen for VR session start/end
        this.renderer.xr.addEventListener('sessionstart', () => {
          console.log('VR session started');
          this.isInXR = true;
          // Make sure the scene is visible in VR
          this.scene.background = new THREE.Color(0x101010); // Darker background for VR
        });

        this.renderer.xr.addEventListener('sessionend', () => {
          console.log('VR session ended');
          this.isInXR = false;
          // Restore original background
          this.scene.background = new THREE.Color(0x202020);
        });
      });
    } catch (error) {
      console.warn('XRButton not available:', error);
    }
  }

  private addARButton() {
    // Create custom AR button since XRButton doesn't support AR mode directly
    const arButton = document.createElement('button');
    arButton.textContent = 'Enter AR';
    arButton.style.position = 'absolute';
    arButton.style.bottom = '20px';
    arButton.style.right = '120px';
    arButton.style.zIndex = '1000';
    arButton.style.background = 'linear-gradient(135deg, #ff6600, #cc4400)';
    arButton.style.color = 'white';
    arButton.style.border = 'none';
    arButton.style.padding = '12px 24px';
    arButton.style.borderRadius = '8px';
    arButton.style.fontSize = '16px';
    arButton.style.cursor = 'pointer';
    arButton.style.boxShadow = '0 4px 15px rgba(255, 102, 0, 0.3)';
    arButton.style.transition = 'all 0.3s ease';

    arButton.addEventListener('mouseenter', () => {
      arButton.style.background = 'linear-gradient(135deg, #cc4400, #992200)';
      arButton.style.transform = 'translateY(-2px)';
      arButton.style.boxShadow = '0 6px 20px rgba(255, 102, 0, 0.4)';
    });

    arButton.addEventListener('mouseleave', () => {
      arButton.style.background = 'linear-gradient(135deg, #ff6600, #cc4400)';
      arButton.style.transform = 'translateY(0)';
      arButton.style.boxShadow = '0 4px 15px rgba(255, 102, 0, 0.3)';
    });

    arButton.addEventListener('click', () => {
      this.enterAR();
    });

    this.webxrContainer.nativeElement.appendChild(arButton);
  }

  private animate() {
    console.log('Starting animation loop');
    this.renderer.setAnimationLoop(() => {
      // Rotate the cube
      if (this.cube) {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
      }

      this.renderer.render(this.scene, this.camera);
    });
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }


  public enterVR() {
    console.log('Attempting to enter VR mode manually');
    if (this.vrSupported && (navigator as any).xr) {
      (navigator as any).xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor']
      }).then((session: any) => {
        console.log('VR session started successfully');
        this.isInXR = true;
        this.xrSession = session;
        this.renderer.xr.setSession(session);
      }).catch((error: any) => {
        console.error('Failed to start VR session:', error);
      });
    } else {
      console.warn('VR not supported or navigator.xr not available');
    }
  }

  public enterAR() {
    console.log('Attempting to enter AR mode');
    if (this.arSupported && (navigator as any).xr) {
      (navigator as any).xr.requestSession('immersive-ar', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hit-test']
      }).then((session: any) => {
        console.log('AR session started successfully');
        this.isInXR = true;
        this.xrSession = session;
        this.renderer.xr.setSession(session);
      }).catch((error: any) => {
        console.error('Failed to start AR session:', error);
      });
    } else {
      console.warn('AR not supported or navigator.xr not available');
    }
  }
}
