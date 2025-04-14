public with sharing class TimeLogController {

   @AuraEnabled
    public static void saveTimeLogs(List<Time_Log__c> timeLogs) {
        List<Time_Log__c> recordsToInsert = new List<Time_Log__c>();
         System.debug('timeLogs-->'+timeLogs);
        insert timeLogs;
          
    }

}