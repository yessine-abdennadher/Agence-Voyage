import { Component, OnInit } from '@angular/core';
import { UserService } from '../Services/user.service';
import { HotelService } from '../Services/hotel.service';
import { PayeService } from '../Services/paye.service';
import { ReservationService } from '../Services/reservation.service';
import { ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  nbUsers = 0;
  nbHotels = 0;
  nbReservations = 0;
  nbpayes = 0;

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  // Graphique 1 : Réservations par pays
  countryChartLabels: string[] = [];
  countryChartData: { 
    labels: string[]; 
    datasets: { data: number[]; label: string }[] 
  } = {
    labels: this.countryChartLabels,
    datasets: [
      { data: [], label: 'Réservations' }
    ]
  };

  // Graphique 2 : Délai moyen par date
  delayChartData: { 
    labels: string[]; 
    datasets: { data: number[]; label: string; fill: boolean; tension: number }[] 
  } = { labels: [], datasets: [] };

  constructor(
    private us: UserService,
    private ps: PayeService,
    private rs: ReservationService,
    private hs: HotelService
  ) {}

  ngOnInit(): void {
    this.us.getAllUsers().subscribe(
      (data) => this.nbUsers = data.users.length,
      (error) => console.error('Erreur utilisateurs:', error)
    );
  
    this.ps.getAllPaye().subscribe(
      (data) => this.nbpayes = data.payes.length,
      (error) => console.error('Erreur payes:', error)
    );
  
    this.rs.getAllReservation().subscribe(
      (data) => {
        this.nbReservations = data.reservations.length;
        this.updateCountryChartData(data.reservations);
        this.calculateAverageDelayByDate(data.reservations);
      },
      (error) => console.error('Erreur réservations:', error)
    );
  
    this.hs.GetAllHotel().subscribe(
      (data) => this.nbHotels = data.hotels.length,
      (error) => console.error('Erreur hôtels:', error)
    );
  }
  
  updateCountryChartData(reservations: any[]): void {
    const countryCounts: { [key: string]: number } = {};

    reservations.forEach(res => {
      const country = res.country;
      if (countryCounts[country]) {
        countryCounts[country]++;
      } else {
        countryCounts[country] = 1;
      }
    });

    this.countryChartLabels = Object.keys(countryCounts);
    const data = Object.values(countryCounts);

    this.countryChartData = {
      labels: this.countryChartLabels,
      datasets: [
        { data, label: 'Réservations' }
      ]
    };
  }

  calculateAverageDelayByDate(reservations: any[]): void {
    if (!reservations || reservations.length === 0) {
      this.delayChartData = { labels: [], datasets: [] };
      return;
    }

    const delaysByDate: { [date: string]: number[] } = {};

    reservations.forEach(res => {
      const dateRes = new Date(res.dateDepart);
      const dateDep = new Date(res.dateRetour);
      const diffTime = dateDep.getTime() - dateRes.getTime();
      if (diffTime <= 0) return;  // ignore les erreurs

      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dateKey = dateRes.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!delaysByDate[dateKey]) {
        delaysByDate[dateKey] = [];
      }
      delaysByDate[dateKey].push(diffDays);
    });

    const labels = Object.keys(delaysByDate).sort();
    const averages = labels.map(date => {
      const total = delaysByDate[date].reduce((sum, d) => sum + d, 0);
      return +(total / delaysByDate[date].length).toFixed(2);
    });

    this.delayChartData = {
      labels,
      datasets: [
        { data: averages, label: 'Délai moyen (jours)', fill: false, tension: 0.4 }
      ]
    };
  }
}
