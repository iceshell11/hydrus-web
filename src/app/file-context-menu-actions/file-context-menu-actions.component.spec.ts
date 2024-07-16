import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileContextMenuActionsComponent } from './file-context-menu-actions.component';

describe('FileContextMenuContentComponent', () => {
  let component: FileContextMenuActionsComponent;
  let fixture: ComponentFixture<FileContextMenuActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileContextMenuActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileContextMenuActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
