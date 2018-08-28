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
        weekNumbers: true,
        height: 500,
        fixedWeekCount: false,
        events: function(start, end, timezone, callback) {
            // Full Calender always starts month with days of previous month.
            // We add 10 days to get month we want.
            var year = moment(start).add('days', 10).format('YYYY');
            var month = moment(start).add('days', 10).format('M');
            AJS.$.ajax({
                url: window.KDPrestUrl + '/overview_page/year/' + year + '/month/' + month,
                dataType: 'json',
                success: function(rawEvents) {
                    var events = [];
                    AJS.$(rawEvents).each(function() {
                        var users = AJS.$(this).attr('users');
                        events.push({
                            title: users.join(', '),
                            start: AJS.$(this).attr('start'),
                            end: AJS.$(this).attr('end'),
                            color: users.length > 0 ? '#36B37E' : '#FFAB00',
                        });
                    });
                    callback(events);
                }
            });
        }
    });
});
