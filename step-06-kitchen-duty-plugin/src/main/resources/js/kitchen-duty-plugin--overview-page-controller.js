

AJS.toInit(function(){
    AJS.log('KDP: Overview Page Controller initializing ...');
    var baseUrl = AJS.params.baseURL;
    var restUrl = baseUrl + '/rest/kitchenduty/1.0';
    window.KDPrestUrl = restUrl;

    // Init Base SOY template
    var overviewPageTemplate = JIRA.Templates.KDPO.overviewPage();
    AJS.$('#kdp-overview-page-container').html(overviewPageTemplate);

    AJS.$('#kdp-calendar').fullCalendar({
        defaultView: 'month',
        weekNumbers: true
    });

});
