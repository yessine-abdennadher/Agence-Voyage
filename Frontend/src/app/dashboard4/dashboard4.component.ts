import { Component, OnInit } from '@angular/core';
import { UserService } from '../Services/user.service';
import { PayeService } from '../Services/paye.service';
import { ReservationService } from '../Services/reservation.service';
import { HotelService } from '../Services/hotel.service';
import { ChartOptions } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Hotel {
  id: string;
  nomHotel: string;
  paye_id: string;
  classement: number;
  adresse: string;
  imageHotel: string[];
  datedabut: string;
  datefin: string;
  chambres?: Chambre[];
  startingPrice?: number;
}

interface Chambre {
  id: string;
  hotel_id: string;
  typeChambre?: string;
  prixchambre?: number;
}

@Component({
  selector: 'app-dashboard4',
  templateUrl: './dashboard4.component.html',
  styleUrls: ['./dashboard4.component.css']
})
export class Dashboard4Component implements OnInit {

  nbUsers: number = 0;
  nbHotels: number = 0;
  nbReservations: number = 0;
  nbpayes: number = 0;

  // Données pour le graphique
  chartLabels: string[] = [];
  chartDataValues: number[] = [];

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  constructor(
    private us: UserService,
    private ps: PayeService,
    private rs: ReservationService,
    private hs: HotelService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin([
      this.us.getAllUsers().pipe(catchError(() => of(null))),
      this.ps.getAllPaye().pipe(catchError(() => of(null))),
      this.rs.getAllReservation().pipe(catchError(() => of(null))),
      this.hs.GetAllHotel().pipe(catchError(() => of(null)))
    ]).subscribe(([userData, payeData, reservationData, hotelData]) => {
      if (userData) this.nbUsers = userData.users?.length || 0;
      if (payeData) this.nbpayes = payeData.payes?.length || 0;
      if (reservationData) this.nbReservations = reservationData.reservations?.length || 0;
      if (hotelData) this.nbHotels = hotelData.hotels?.length || 0;

      if (hotelData && payeData) {
        this.prepareChartData(hotelData.hotels, payeData.payes);
      }
    });
  }

  prepareChartData(hotels: Hotel[], paysList: any[]): void {
    const paysMap = new Map<string, string>();
    for (const pays of paysList) {
      paysMap.set(pays.id, pays.nompaye);
    }
    console.log(paysMap)
    

    const countByPaysName: Map<string, number> = new Map();

    hotels.forEach(hotel => {
      const paysName = paysMap.get(hotel.paye_id) || 'Inconnu'; // ✅ Correction ici
      const count = countByPaysName.get(paysName) || 0;
      countByPaysName.set(paysName, count + 1);
    });

    // Convertir en tableau pour chart.js
    this.chartLabels = Array.from(countByPaysName.keys());
    this.chartDataValues = Array.from(countByPaysName.values());

    console.log("Nombre d'hôtels par pays:", Object.fromEntries(countByPaysName));
  }

  get chartData() {
    return {
      labels: this.chartLabels,
      datasets: [
        {
          label: 'Nombre d\'hôtels par pays',
          data: this.chartDataValues,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0', '#FF9800'
          ]
        }
      ]
    };
  }
}