Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
		
	launch: function() {
        //Write app code here
		console.log('Welcome to the Portfolio Items By Tag app');
	
        //API Docs: https://help.rallydev.com/apps/2.0/doc/
		this._loadData();
    },
	
	_getFilters: function(pFilterTag) {
		var tagFilter = Ext.create('Rally.data.wsapi.Filter', {
			property: 'Tags.Name',
			operation: '=',
			value: pFilterTag
		});
		
		console.log('Filter is ', tagFilter.toString());
		
		return tagFilter;
	},
	
	_loadData: function() {
		// only create the store once...
		console.log('START _loadData...');
		
		var filterTag = "Enterprise Backlog";
		
		var backlogFilters = this._getFilters(filterTag);
		
		if (this.portfolioItemStore) {
			// store exists, refresh it
			console.log('    store exists...');
			this.portfolioItemStore.setFilter(backlogFilters);
			this.portfolioItemStore.load();
		} else {
			// store doesn't exist, create it
			console.log('     store does not exist...');
			
			this.portfolioItemStore = Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
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
