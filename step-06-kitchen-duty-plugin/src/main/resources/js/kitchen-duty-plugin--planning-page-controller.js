var initUserSearch = function(weekIsoWeekNumber) {
    // Init SOY template
    var planningPageWeekUsersTemplate = JIRA.Templates.KDP.planningPageWeekUsers({
        isoWeek: weekIsoWeekNumber
    });
    AJS.$('#kdp-planning-page-week-users-container').html(planningPageWeekUsersTemplate);

    // Init actions
    var auiUserSelectOptions = {
        ajax: {
            url: function () { return window.KDPrestUrl + '/user/search'; },
            dataType: 'json',
            delay: 250,
            data: function (searchTerm) { return { query: searchTerm }; },
            results: function (data) { return { results: data }; },
            cache: true
        },
        minimumInputLength: 1,
        tags: 'true'
    };
    AJS.$('#kdp-user-select').auiSelect2(auiUserSelectOptions);

    // Load initial values from REST API and set for aui-select
    if (weekIsoWeekNumber !== null) {
        AJS.$.ajax({
            url: window.KDPrestUrl + '/planning/week/' + weekIsoWeekNumber + '/users',
            dataType: 'json',
            success: function(users) {
                var selectedUserList = [];
                if (users !== null) {
                    users.forEach(function(user) {
                        selectedUserList.push({ id: user.username, text: user.username });
                    });
                    AJS.$('#kdp-user-select').select2('data', selectedUserList);
                }
            }
        });
    }

    // Save users on save button click
    AJS.$('#kdp-user-select-form').off(); // remove previous listeners
    AJS.$('#kdp-user-select-form').submit(function (e) {
        e.preventDefault();
        var selectedUserList = [];
        AJS.$(AJS.$('#kdp-user-select').select2('data')).each(function () {
            // we need to transform the JSON sent to the Endpoint since it
            // has to be in specific format
            selectedUserList.push({ username: this.text });
        });
        AJS.$.ajax({
            url: window.KDPrestUrl + '/planning/week/' + weekIsoWeekNumber + '/users',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(selectedUserList),
            processData: false,
            success: function() {
                showSuccessFlag('Saved users for Week ' + weekIsoWeekNumber);
            },
            error: function() {
                showErrorFlag('Failed to save users for Week ' + weekIsoWeekNumber);
            }
        });
    });
};

var initWeekPicker = function() {
    // Init SOY template
    var planningPageWeekTemplate = JIRA.Templates.KDP.planningPageWeek();
    AJS.$('#kdp-planning-page-week-container').html(planningPageWeekTemplate);

    // Init actions
    AJS.$('#week-picker').off(); // remove previous listeners
    AJS.$('#week-picker').datePicker({'overrideBrowserDefault': true});
    AJS.$('#week-picker').change(function() {
        // Note: We do not use isoWeek() anymore since we misunderstood what
        //       iso weeks are. We want normal weeks starting on sunday.
        var dateValueFromPicker = AJS.$('#week-picker').val();
        var isoWeek = moment(dateValueFromPicker).week();
        console.log('Date from picker: ' + dateValueFromPicker +
                    ' calcualted to week: ' + isoWeek);
        initUserSearch(isoWeek);
    });
};

AJS.toInit(function(){
    AJS.log('KDP: Planning Page Controller initializing ...');
    var baseUrl = AJS.params.baseURL;
    var restUrl = baseUrl + '/rest/kitchenduty/1.0';
    window.KDPrestUrl = restUrl;

    // set locale for moment-js so that week starts on sunday
    // and week numbers are correctly calcualted
    moment.locale('en', {
        week: {
            dow: 0, // Sunday (0) is the first day of the week
            doy: 1  // The week that contains Jan 1st is the first week of the year.
        }
    });
    console.log('Week starts at: ' + moment().startOf('week').format('dddd'));
    console.log('Current moment locale: ' + moment().locale());

    // Init Base SOY template
    var planningPageTemplate = JIRA.Templates.KDP.planningPage();
    AJS.$('#kdp-planning-page-container').html(planningPageTemplate);

    // Init child templates
    initWeekPicker();
    initUserSearch(null);
});
