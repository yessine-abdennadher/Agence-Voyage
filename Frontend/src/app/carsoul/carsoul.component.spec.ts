import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarsoulComponent } from './carsoul.component';

describe('CarsoulComponent', () => {
  let component: CarsoulComponent;
  let fixture: ComponentFixture<CarsoulComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CarsoulComponent]
    });
    fixture = TestBed.createComponent(CarsoulComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
