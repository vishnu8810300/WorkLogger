public with sharing class TimeLogController {

   
    
    @AuraEnabled
    public static void saveTimeLogs(List<TimeLogWrapper> timeLogs) {
        List<Time_Log__c> recordsToInsert = new List<Time_Log__c>();

        for (TimeLogWrapper entry : timeLogs) {
            if (entry.workStartTime == null || entry.workEndTime == null || String.isBlank(entry.ProjectId)) {
                continue; // Skip invalid entry
            }

            Time_Log__c log = new Time_Log__c();
            log.Project__c = 'a00WU00000jtFiuYAE';
            log.Work_Start_Time__c = entry.workStartTime;
            log.Work_End_Time__c = entry.workEndTime;
            log.Employee__c = UserInfo.getUserId(); // or pass user ID if manager is entering on behalf
            log.Log_Date__c = entry.workStartTime.date(); // Use start time as the day reference

            recordsToInsert.add(log);
        }

        if (!recordsToInsert.isEmpty()) {
            insert recordsToInsert;
        }
    }

    // Fetch current user time logs
    @AuraEnabled(cacheable=true)
    public static List<Time_Log__c> getTimeLogsByUser() {
        return [
            SELECT Id,
                   Project__r.Name,
                   Work_Start_Time__c,
                   Work_End_Time__c,
                   Hours_Spent__c,
                   Log_Date__c
            FROM Time_Log__c
            WHERE Employee__c = :UserInfo.getUserId()
            ORDER BY Log_Date__c DESC, Work_Start_Time__c ASC
        ];
    }

    // Wrapper used for LWC input (JSON -> Apex)
    public class TimeLogWrapper {
        @AuraEnabled public String projectId;
        @AuraEnabled public Datetime workStartTime;
        @AuraEnabled public Datetime workEndTime;
    }
}