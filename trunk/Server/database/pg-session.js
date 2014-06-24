module.exports = function(session) {
	
	function PostgresStore(pg, url) {
		this.pg = pg;
		this.url = url;
	}
	
	PostgresStore.prototype.__proto__ = session.Store.prototype;
	
	PostgresStore.prototype.get = function(sid, callback) {
		this.pg.connect(this.url, function(err, client, done) {
			if(err) {
				console.error('Failed to connect in pg-session.get', err);
				callback(err);
				return;
			}
			
			client.query('SELECT data FROM session WHERE id = $1', [sid], function(err, result){
				done();
				
				if(err) {
					console.error('Failed to get session', err);
					callback(err);
					return;
				}
				
				if(result.rows.length == 1) {
					callback(null, JSON.parse(result.rows[0].data));
				} else {
					callback('session not found');
				}
			});
		});
	};
	
	PostgresStore.prototype.set = function(sid, session, callback) {
		this.pg.connect(this.url, function(err, client, done) {
			if(err) {
				console.error('Failed to connect in pg-session.set', err);
				callback(err);
				return;
			}
			
			// update session data if available
			client.query('UPDATE session SET data = $1 WHERE id = $2',
				[JSON.stringify(session), sid], function(err, result){
				
				if(err) {
					console.error('Failed to update session', err);
					callback(err);
					return;
				}
				
				// if the session is not already in our database ...
				if(result.rowCount == 0) {
					// ... then insert it
					client.query('INSERT INTO session(id,data,created) VALUES($1,$2,$3)',
						[sid,JSON.stringify(session),new Date()], function(err, result){
					
						done();
					
						if(err) {
							console.error('Failed to insert session', err);
							callback(err);
							return;
						}
						
						callback(null);
					});
				} else {
					done();
					
					callback(null);
				}
			});
		});
	};
	
	PostgresStore.prototype.destroy = function(sid, callback) {
		this.pg.connect(this.url, function(err, client, done) {
			if(err) {
				console.error('Failed to connect in pg-session.destroy', err);
				callback(err);
				return;
			}
			
			client.query('DELETE FROM session WHERE id = $1', [sid], function(err, result) {
				done();
				
				if(err) {
					console.error('Failed to delete session', err);
					callback(err);
					return;
				}
				
				callback(null);
			});
		});
	};
	
	return PostgresStore;
};