Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
	
	items: [
		{
			xtype: 'container',
			id: 'filter-container',
			layout: {
				type: 'hbox',
				align: 'stretch'
			}
		}
	],
	
	portfolioItemGrid: undefined,
	portfolioItemStore: undefined,
		
	launch: function() {
        //Write app code here
		console.log('Welcome to the Portfolio Items By Tag app');
	
        //API Docs: https://help.rallydev.com/apps/2.0/doc/
		// load the filters, starting with Quarters
		this._loadQuarters();
    },
	
	_getQuarterStore : function() {
		if (this.quarterStore) {
			return this.quarterStore;
		} else {
			this.quarterStore = Ext.create('Ext.data.Store', {
				fields: ['quarter', 'selValue', 'startDate', 'endDate'],
				data : [
					{"quarter":"-- No Entry --", "selValue":"", "startDate": "", "endDate": ""},
					{"quarter":"2016Q1", "selValue":"2016Q1", "startDate": Ext.Date.parse("2016-01-01T00:00:00-0500","c"), "endDate": Ext.Date.parse("2016-03-31T23:59:59-0400","c")},
					{"quarter":"2016Q2", "selValue":"2016Q2", "startDate": Ext.Date.parse("2016-04-01T00:00:00-0500","c"), "endDate": Ext.Date.parse("2016-06-30T23:59:59-0400","c")},
					{"quarter":"2016Q3", "selValue":"2016Q3", "startDate": Ext.Date.parse("2016-07-01T00:00:00-0500","c"), "endDate": Ext.Date.parse("2016-09-30T23:59:59-0400","c")},
					{"quarter":"2016Q4", "selValue":"2016Q4", "startDate": Ext.Date.parse("2016-10-01T00:00:00-0500","c"), "endDate": Ext.Date.parse("2016-12-31T23:59:59-0400","c")}
				]
			});
		}
		
		return this.quarterStore;
	},
	
	// Create the Quarter drop down filter
	_loadQuarters: function() {
		// The data store containing the list of states
		console.log('Load the Quarter filter drop down...');
		
		// Create the combo box, attached to the states data store
		var quarterCombo = Ext.create('Ext.form.ComboBox', {
			id: 'quarter-combo',
			fieldLabel: 'Quarter',
			labelAlign: 'right',
			store: this._getQuarterStore(),
			queryMode: 'local',
			displayField: 'quarter',
			valueField: 'selValue',
			value: "",
			listeners: {
				afterrender: this._loadTeams,
				select: this._loadData,
				scope: this
			}
		});	
		
		// add the quarter combo to the filter container
		this.down('#filter-container').add(quarterCombo);
	},
	
	// Create the Team drop down filter
	_loadTeams: function() {
		console.log('Create the Team drop down...');
		
		var teamCombo = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
			itemId: 'team-combobox',
			model: 'PortfolioItem/Feature',
			field: 'c_DeliveryTeam',
			fieldLabel: 'Team',
			labelAlign: 'right',
			listeners: {
				ready: this._loadCategories,
				select: this._loadData,
				scope: this
			}
		});
		
		this.down('#filter-container').add(teamCombo);
	},
	
	// Create the Category drop down filter
	_loadCategories: function() {
		console.log('Create the Category drop down...');
		
		var categoryCombo = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
			itemId: 'category-combobox',
			model: 'PortfolioItem/Feature',
			field: 'c_ProjectCategory',
			fieldLabel: 'Category',
			labelAlign: 'right',
			listeners: {
				ready: this._loadData,
				select: this._loadData,
				scope: this
			}
		});
		
		this.down('#filter-container').add(categoryCombo);
	},
	
	_getFilters: function(pFilterTag, pFilterQuarter, pFilterTeam, pFilterCategory) {
		console.log('Building Filter...', pFilterQuarter, pFilterTeam, pFilterCategory);
		
		var tagFilter = Ext.create('Rally.data.wsapi.Filter', {
			property: 'Tags.Name',
			operation: '=',
			value: pFilterTag
		});
		if (pFilterQuarter) {
			var quarters = this._getQuarterStore();
			var selectedQuarterIndex = quarters.find("selValue",pFilterQuarter);
			var selectedQuarter = quarters.getAt(selectedQuarterIndex);
			//console.log('Quarter Store', quarters);
			//console.log('Selected Quarter Index', selectedQuarterIndex);
			//console.log('Selected Quarter', selectedQuarter);
			//console.log('End Date', selectedQuarter.get('endDate'));
			
			var quarterFilter1 = Ext.create('Rally.data.wsapi.Filter', {
				property: 'PlannedStartDate',
				operator: '<=',
				value: Ext.Date.format(selectedQuarter.get('endDate'),"c")
			});
			var quarterFilter2 = Ext.create('Rally.data.wsapi.Filter', {
				property: 'PlannedEndDate',
				operator: '>=',
				value: Ext.Date.format(selectedQuarter.get('startDate'),"c")
			});
			var quarterFilter = quarterFilter1.and(quarterFilter2);
			tagFilter = tagFilter.and(quarterFilter);
		}
		if (pFilterTeam) {
			var teamFilter = Ext.create('Rally.data.wsapi.Filter', {
				property: 'c_DeliveryTeam',
				operator: '=',
				value: pFilterTeam
			});
			tagFilter = tagFilter.and(teamFilter);
		}
		if (pFilterCategory) {
			var categoryFilter = Ext.create('Rally.data.wsapi.Filter', {
				property: 'c_ProjectCategory',
				operator: '=',
				value: pFilterCategory
			});
			tagFilter = tagFilter.and(categoryFilter);
		}
		
		console.log('Filter is ', tagFilter.toString());
		
		return tagFilter;
	},
	
	_loadData: function() {
		// only create the store once...
		console.log('START _loadData...');
		
		var filterTag = "Enterprise Backlog";
		var selectedQuarter = this.down('#quarter-combo').getValue();
		var selectedTeam = this.down('#team-combobox').getRecord().get('value');
		var selectedCategory = this.down('#category-combobox').getRecord().get('value');
		
		console.log('Quarter, Team, Category: ',selectedQuarter,selectedTeam,selectedCategory);
		
		var backlogFilters = this._getFilters(filterTag,selectedQuarter,selectedTeam,selectedCategory);
		
		if (this.portfolioItemStore) {
			// store exists, refresh it
			console.log('    store exists...');
			this.portfolioItemStore.clearFilter(true);
			this.portfolioItemStore.filter(backlogFilters);
		} else {
			// store doesn't exist, create it
			console.log('     store does not exist...');
			
			Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
				models: ['PortfolioItem/Theme','PortfolioItem/Initiative','PortfolioItem/Feature'],
				autoLoad: true,
				enableHierarchy: true,
				pageSize: 200,
				filters: backlogFilters,
				sorters: [
					{
						property: 'PlannedStartDate',
						direction: 'ASC'
					}
				],
				context: {
					workspace: 'workspace/22050374191',
					project: 'project/22050374281',
					projectScopeUp: false,
					projectScopeDown: true
				}
			}).then({
				success: this._createGrid,
				scope: this
			});
		}
		console.log('END _loadData');
	},
	
	// Create Grid
	_createGrid: function(pPortfolioItemStore) {
		console.log('START _createGrid...');	
		this.portfolioItemStore = pPortfolioItemStore;
		this.portfolioItemGrid = Ext.create('Rally.ui.grid.TreeGrid', {
			store: pPortfolioItemStore,
			context: {
				workspace: 'workspace/22050374191',
				project: 'project/22050374281',
				projectScopeUp: false,
				projectScopeDown: true
			},
			enableEditing: true,
			enableBulkEdit: false,
			shouldShowRowActionsColumn: false,
			enableRanking: false,
			columnCfgs: [
				{
					dataIndex: 'c_DeliveryTeam',
					width: 125
				},
				{
					dataIndex: 'c_ProjectCategory',
					width: 125
				},
				{	
					dataIndex: 'Name',
					hideable: false,
					flex: 1
				},
				{
					dataIndex: 'State',
					width: 90
				},
				{
					dataIndex: 'PreliminaryEstimate',
					width: 80,
					align: 'center'
				},
				{
					text: 'Total Estimate',
					dataIndex: 'LeafStoryPlanEstimateTotal',
					width: 80,
					align: 'center'
				},
				{
					dataIndex: 'PercentDoneByStoryPlanEstimate',
					width: 250,
					align: 'center'
				},
				{
					dataIndex: 'PlannedStartDate',
					width: 100,
					align: 'center'
				},
				{
					dataIndex: 'PlannedEndDate',
					width: 100,
					align: 'center'
				}
			]
		});
		
		this.add(this.portfolioItemGrid);
		console.log('END _createGrid');
	}
});
