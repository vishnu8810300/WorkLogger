import { LightningElement, track } from 'lwc';
import saveTimeLogs from '@salesforce/apex/TimeLogController.saveTimeLogs';
import getTimeLogsByUser from '@salesforce/apex/TimeLogController.getTimeLogsByUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { RefreshEvent } from 'lightning/refresh';

export default class TimeLogDashboard extends LightningElement {
  @track selectedDate = '';
  parentAccountSelectedRecord
  @track entries = [
    {
        id: 0,
        projectId: '',
        startTime: '',
        endTime: '',
        spentHours: 0
    }
];
@track projectOptions = [
  { label: 'Project Alpha', value: 'a0123456789' },
  { label: 'Project Beta', value: 'b0123456789' }
];
  nextId = 1;

  connectedCallback() {
    this.loadProjects();
    this.loadExistingLogs();
  }
  handleDateChange(event) {
    this.selectedDate = event.target.value;
}

  loadProjects() {
    // Replace with actual Apex call to fetch project options
    this.projectOptions = [
      { label: 'Project Alpha', value: 'a0123456789' },
      { label: 'Project Beta', value: 'b0123456789' }
    ];
  }
  handleValueSelectedOnAccount(event) {
    this.parentAccountSelectedRecord = event.detail;
}

  loadExistingLogs() {
    getTimeLogsByUser()
      .then((data) => {
        console.log('Fetched logs:', data);
      })
      .catch((error) => {
        console.error('Error fetching logs:', error);
      });
  }

  handleChange(event) {
    console.log('test1---');
    const index = event.target.dataset.index;
    const field = event.target.dataset.field || 'projectId';
    const value = event.detail.value;

    this.entries = this.entries.map((entry, i) => {
        if (i === parseInt(index, 10)) {
            const updatedEntry = { ...entry, [field]: value };
            if (field === 'startTime' || field === 'endTime') {
                updatedEntry.spentHours = this.calculateSpentHours(updatedEntry.startTime, updatedEntry.endTime);
            }
            return updatedEntry;
        }
        return entry;
    });
    console.log('test---'+this.entries);
}

addEntry() {
  console.log('test---');
  let defaultStartTime = '';
  if (this.entries.length > 0) {
      const lastEntry = this.entries[this.entries.length - 1];
      defaultStartTime = lastEntry.endTime || '';
  }
  this.entries = [
      ...this.entries,
      {
          id: this.nextId++,
          projectId: '',
          startTime: defaultStartTime,
          endTime: '',
          spentHours: 0
      }
  ];
}

removeEntry() {
  if (this.entries.length > 1) {
      this.entries = this.entries.slice(0, -1);
  }
}

calculateSpentHours(start, end) {
  if (start && end) {
      const startTime = new Date(`1970-01-01T${start}`);
      const endTime = new Date(`1970-01-01T${end}`);
      const diffMs = endTime - startTime;
      console.log('diffMs-->'+diffMs);
      return diffMs > 0 ? (diffMs / (1000 * 60 * 60)).toFixed(2) : 0;
  }
  return 0;
}



  handleSubmit() {
    console.log('entry-->'+JSON.stringify(this.entries));
    let totalMinutes = 0;
    const payload = this.entries.map((entry) => ({
     Project__c: this.parentAccountSelectedRecord.id,
     Work_Start_Time__c: new Date(this.selectedDate+'T'+entry.startTime+'Z'),
     Work_End_Time__c: new Date(this.selectedDate+'T'+entry.endTime+'Z')
     
    }));

    

    this.entries = this.entries.map(entry => {
      if (entry.startTime && entry.endTime) {
        const start = new Date(`1970-01-01T${entry.startTime}`);
        const end = new Date(`1970-01-01T${entry.endTime}`);
        const diffMs = end - start;
  
        if (diffMs > 0) {
          const entryMinutes = Math.floor(diffMs / (1000 * 60));
          totalMinutes += entryMinutes;
  
        } 
      } 
      return entry;
    });

    if (totalMinutes < 480) { // 8 hours * 60 minutes
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'Total time spent must be at least 8 hours.',
          variant: 'error'
        })
      );
      return;
    }

    if (totalMinutes < 8) { // 8 hours * 60 minutes
      // Display error message to the user
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'Total time spent must be at least 8 hours.',
          variant: 'error'
        })
      );
      return; // Prevent submission
    }

console.log('payload-->'+JSON.stringify(payload));

    saveTimeLogs({ timeLogs: payload })
      .then(() => {
        this.entries = [
          {
            id: 0,
            projectId: '',
            startDateTime: '',
            endDateTime: ''
          }
        ];
        this.nextId = 1;
       
        this.dispatchEvent(new RefreshEvent());
        const child = this.template.querySelector('c-reusable-lookup');
        if (child) {
            child.refresh();
        }
        // Optionally, display a success message to the user
      })
      .catch((error) => {
        console.error('Error saving logs:', error);
        // Optionally, display an error message to the user
      });
  }
}