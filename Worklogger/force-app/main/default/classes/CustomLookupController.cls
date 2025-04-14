public with sharing class CustomLookupController {
    @AuraEnabled(cacheable=true)
    public static List<SObject> searchRecords(String searchKey, String objectApiName, String fieldApiName) {
        String searchPattern = '%' + String.escapeSingleQuotes(searchKey) + '%';
        String query = 'SELECT Id, Name FROM ' + objectApiName + ' WHERE ' + fieldApiName + ' LIKE :searchPattern LIMIT 10';
        return Database.query(query);
    }
}