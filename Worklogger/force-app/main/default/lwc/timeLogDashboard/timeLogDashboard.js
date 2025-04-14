import { LightningElement, track } from 'lwc';
import getTimeLogsByUser from '@salesforce/apex/TimeLogController.getTimeLogsByUser';

export default class TimeLogDashboard extends LightningElement {
  @track logs = [];
  @track error;
  @track showForm = false;
  @track isLoading = false;

  columns = [
    { label: 'Project', fieldName: 'ProjectName' },
    { label: 'Start Time', fieldName: 'Work_Start_Time__c', type: 'date', typeAttributes: { hour: '2-digit', minute: '2-digit' } },
    { label: 'End Time', fieldName: 'Work_End_Time__c', type: 'date', typeAttributes: { hour: '2-digit', minute: '2-digit' } },
    { label: 'Hours Spent', fieldName: 'Hours_Spent__c' },
    { label: 'Log Date', fieldName: 'Log_Date__c', type: 'date' }
  ];

  connectedCallback() {
    this.loadLogs();
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  handleLogSubmitted() {
    this.loadLogs();
    this.showForm = false;
  }

  loadLogs() {
    this.isLoading = true;
    getTimeLogsByUser()
      .then((data) => {
        this.logs = data.map(row => ({
          Id: row.Id,
          ProjectName: row.Project__r?.Name || 'N/A',
          Work_Start_Time__c: row.Work_Start_Time__c,
          Work_End_Time__c: row.Work_End_Time__c,
          Hours_Spent__c: row.Hours_Spent__c,
          Log_Date__c: row.Log_Date__c
        }));
        this.error = null;
        this.isLoading = false;
      })
      .catch((error) => {
        this.error = error.body.message;
        this.isLoading = false;
      });
  }
}