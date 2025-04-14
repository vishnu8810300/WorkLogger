public class DailyTimeLogReminderBatch implements Database.Batchable<SObject>, Database.Stateful, Schedulable  {

  public Database.QueryLocator start(Database.BatchableContext BC) {
        // Query all active users with valid email addresses
        return Database.getQueryLocator([SELECT Id, Name, Email FROM User WHERE IsActive = true AND Email != null AND Profile.Name = 'Employee Profile']);
    }
     public void execute(Database.BatchableContext BC, List<User> scope) {
        // Collect user IDs from the current batch
        Set<Id> theUserIds = new Set<Id>();
        for (User theUser : scope) {
            theUserIds.add(theUser.Id);
        }

        // Query today's time logs for these users
        List<Time_Log__c> theTimeLogs = [SELECT CreatedById, Hours_Spent__c FROM Time_Log__c WHERE Work_Date__c = TODAY AND OwnerId IN :theUserIds];

        // Map to store total hours per user
        Map<Id, Decimal> theUserHoursMap = new Map<Id, Decimal>();
        for (Time_Log__c log : theTimeLogs) {
            if ( log.Hours_Spent__c != null) {
                if (!theUserHoursMap.containsKey(log.CreatedById)) {
                    theUserHoursMap.put(log.CreatedById, log.Hours_Spent__c);
                } else {
                    theUserHoursMap.put(log.CreatedById, theUserHoursMap.get(log.CreatedById) + log.Hours_Spent__c);
                }
            }
        }

        // Prepare and send emails
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for (User theUser : scope) {
            Decimal hoursLogged = theUserHoursMap.get(theUser.Id);
            if (hoursLogged == null || hoursLogged < 8) {
                String hoursText = hoursLogged != null ? String.valueOf(hoursLogged) : '0';
                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                mail.setToAddresses(new String[] { theUser.Email });
                mail.setSubject('Reminder: Incomplete Time Log for ' + Date.today().format());
                mail.setPlainTextBody('Dear ' + theUser.Name + ',\n\nOur records indicate that you have logged '
                    + hoursText + ' hours today. Please ensure you log at least 8 hours.\n\nThank you.');
                emails.add(mail);
            }
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
    public void finish(Database.BatchableContext BC) {
        
    }
    
      public void execute(SchedulableContext sc) {
        DailyTimeLogReminderBatch batch = new DailyTimeLogReminderBatch();
        Database.executeBatch(batch, 200); 
    }
}