global class WeeklyTimeLogReminderBatch implements Database.Batchable<SObject>, Database.Stateful, Schedulable {

    global Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator([SELECT Id, Name, Email FROM User WHERE IsActive = true AND Email != null AND Profile.Name = 'Employee Profile']);
    }

    global void execute(Database.BatchableContext BC, List<User> scope) {
        Set<Id> theUserIds = new Set<Id>();
        for (User theUser : scope) {
            theUserIds.add(theUser.Id);
        }

        Date theWeekEnd = Date.today(); 
        Date theWeekstart = theWeekEnd.addDays(-4); 
     
        List<Time_Log__c> timeLogs = [SELECT CreatedbyId, Hours_Spent__c FROM Time_Log__c WHERE Work_Date__c >= :theWeekstart AND Work_Date__c <= :theWeekEnd AND OwnerId IN :theUserIds];

        Map<Id, Decimal> theUserHoursMap = new Map<Id, Decimal>();
        for (Time_Log__c theLog : timeLogs) {
            if(theLog.Hours_Spent__c != null) {
                if (!theUserHoursMap.containsKey(theLog.CreatedbyId)) {
                    theUserHoursMap.put(theLog.CreatedbyId, theLog.Hours_Spent__c);
                } else {
                    theUserHoursMap.put(theLog.CreatedbyId, theUserHoursMap.get(theLog.CreatedbyId) + theLog.Hours_Spent__c);
                }
            }
        }

        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for (User theUser : scope) {
            Decimal hoursLogged = theUserHoursMap.get(theUser.Id);
            if (hoursLogged == null || hoursLogged < 40) {
                String hoursText = hoursLogged != null ? String.valueOf(hoursLogged) : '0';
                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                mail.setToAddresses(new String[] { theUser.Email });
                mail.setSubject('Reminder: Incomplete Weekly Time Log (' + theWeekstart.format() + ' - ' + theWeekEnd.format() + ')');
                mail.setPlainTextBody('Dear ' + theUser.Name + ',\n\nOur records indicate that you have logged '
                    + hoursText + ' hours this week. Please ensure you log at least 40 hours.\n\nThank you.');
                emails.add(mail);
            }
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }

    global void finish(Database.BatchableContext BC) {
    }

    global void execute(SchedulableContext sc) {
        WeeklyTimeLogReminderBatch batch = new WeeklyTimeLogReminderBatch();
        Database.executeBatch(batch, 200); 
    }
}