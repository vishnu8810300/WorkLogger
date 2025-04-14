import { LightningElement, track } from 'lwc';
import saveTimeLogs from '@salesforce/apex/TimeLogController.saveTimeLogs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { RefreshEvent } from 'lightning/refresh';

export default class TimeLogDashboard extends LightningElement {
  @track selectedDate = '';
  ValidateEntry = false;
  @track entries = [
    {
        id: 0,
        projectId: '',
        startTime: '',
        endTime: '',
        spentHours: 0
    }
];
  nextId = 1;

  connectedCallback() {
  }
  handleDateChange(event) {
    this.selectedDate = event.target.value;
}

  handleValueSelectedOnAccount(event) {
const { id: selectedProjectId, entryId } = event.detail;
  this.entries = this.entries.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, projectId: selectedProjectId };
      }
      return entry;
    });
}


  handleChange(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const field = event.target.dataset.field || 'projectId';
    const value = event.detail.value;

    this.entries = this.entries.map((entry, i) => {
        if (i === index) {
            const updatedEntry = { ...entry, [field]: value };

            if (field === 'startTime' || field === 'endTime') {
                const { startTime, endTime } = updatedEntry;
                if (startTime && endTime) {
                    updatedEntry.spentHours = this.calculateSpentHours(startTime, endTime);
                } else {
                    updatedEntry.spentHours = 0;
                }
            }

            return updatedEntry;
        }
        return entry;
    });
}

addEntry() {
   
  this.ValidateEntry == false;
  this.entries = this.entries.map(entry => {
     if(entry.startTime == null || entry.startTime == '' ||  entry.endTime == null || entry.endTime == '' ||
       entry.projectId == null || entry.projectId == '' || this.selectedDate == null || this.selectedDate == '' ) {
        this.ValidateEntry = true;

    }
    return entry;
  });
  if (this.ValidateEntry == true) { 
    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Error',
        message: 'Please fill required fields',
        variant: 'error'
      })
    );
    return; 
  }

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

calculateSpentHours(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date();
  endDate.setHours(endHour, endMinute, 0, 0);

  if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
  }

  const diffMs = endDate - startDate;
  const diffHours = diffMs / (1000 * 60 * 60);

  return parseFloat(diffHours.toFixed(2));
}




  handleSubmit() {
    let totalMinutes = 0;
    this.ValidateEntry == false;
    const payload = this.entries.map((entry) => ({
     Project__c: entry.projectId,
     Work_Start_Time__c: new Date(this.selectedDate+'T'+entry.startTime+'Z'),
     Work_End_Time__c: new Date(this.selectedDate+'T'+entry.endTime+'Z')
     
    }));

    JSON.stringify(payload)

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
      if(entry.startTime == null || entry.startTime == '' ||  entry.endTime == null || entry.endTime == '' ||
         entry.projectId == null || entry.projectId == '' || this.selectedDate == null || this.selectedDate == '' ) {
          this.ValidateEntry = true;

      }
      return entry;
    });

    if (this.ValidateEntry == true) { 
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'Please fill required fields',
          variant: 'error'
        })
      );
      return; 
    }

    if (totalMinutes <= 8) { 
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error',
          message: 'Total time spent must be less than 8 hours.',
          variant: 'error'
        })
      );
      return; 
    }

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
      })
      .catch((error) => {
        console.error('Error saving logs:', error);
      });
  }

}