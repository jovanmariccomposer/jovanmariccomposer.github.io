(function(window) {
	var tracks_path = "http://api.soundcloud.com/users/290078921/tracks?client_id=AxxKKJZojwz1G80t09Da2qsZIcd2XaGz";
	var playlists_path = "http://api.soundcloud.com/users/290078921/playlists?client_id=AxxKKJZojwz1G80t09Da2qsZIcd2XaGz";
	var tracks = {};
	
	function getPlaylists () {
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			if (xhr.response) {
				var data = JSON.parse(xhr.response)
				for (var i = 0; i < data.length; i++) {
					tracks[data[i]['permalink']] = data[i]['tracks'];
				}
			}
		}
		xhr.open('get', playlists_path, false);
		xhr.send();
	}
	function trackStore (tracks) {
		if (!tracks.length) return false;
		var _this = this;
		_this.tracksInfo = tracks;
		return _this;
	}

	function createElement(tag, content, attribute) {
		var node = document.createElement(tag);
		node.innerHTML = content; 
		node.setAttribute(attribute[0], attribute[1]);
		return node;
	}
	function removeFromSiblings(node, attribute) {
		var children = node.parentNode.children;
	    for (var n = children.length - 1; n >= 0; n--) {
	        if (children[n] != node && children[n].hasAttribute(attribute)) {
	            children[n].removeAttribute(attribute);
	        }  
	    }
	}
	function timeFormat(duration) {
	    var seconds = parseInt((duration/1000)%60), 
	    	minutes = parseInt((duration/(1000*60))%60);
	    minutes = (minutes < 10) ? "0" + minutes : minutes;
	    seconds = (seconds < 10) ? "0" + seconds : seconds;

	    return minutes + ":" + seconds;
	}
	function PlaylistStore () {
		var _this = this;
		_this.playlists = {};
		_this.resetPlaylists = function() {
			var playlists = Object.keys(_this.playlists);
			for (var i = 0; i < playlists.length; i++) {
				_this.playlists[playlists[i]].stop();
			}
		};
		_this.stopOtherPlaylists = function(id) {
			var playlists = Object.keys(_this.playlists);
			for (var i = 0; i < playlists.length; i++) {
				if (playlists[i] !== id) {
					_this.playlists[playlists[i]].stop();
				}
			}
		};
		_this.register = function(id, playlist) {
			if (!_this.playlists.hasOwnProperty(id)) {
				_this.playlists[id] = playlist;
			}
			return playlist;
		}
	}

	function Playlist (el, tracklist) {
		var _this = this;
		_this.statusCode = {
			ready: 0,
			active: 1,
			buffering: 2,
			error: 3
		};
		_this.playing = false;
		_this.active = null;
		_this.tracks = tracklist;
		_this.container = el; 
		_this.description = (function() {
			return _this.container.getElementsByClassName('description')[0].getElementsByTagName('P')[0];
		})();
		_this.title = (function() {
			return _this.container.getElementsByClassName('description')[0].getElementsByTagName('H3')[0];
		})();
		_this.currentlyPlaying = (function() {
			return _this.container.getElementsByClassName('currentlyPlaying')[0];
		})();
		_this.placeholder = (function() {
			return _this.container.getElementsByClassName('placeholder')[0];
		})();

		_this.playerButton = (function() {
			return _this.container.getElementsByTagName('BUTTON')[0];
		});

		_this.DOMScroll = null;


		_this.callback = function (event) {
		
			if (event.target.hasAttribute('data-src')) {
				if (event.target.hasAttribute('data-active')) {
					_this.player.pause();
					event.target.removeAttribute('data-active');
					return;
				} else {
					removeFromSiblings(event.target, 'data-active');
					_this.player.play(event.target.getAttribute('data-src'));
					event.target.setAttribute('data-active', true);
					return;
				}
			}

			if (event.target.tagName == 'BUTTON') {
				if (_this.playing) {
				//	_this.icon.innerHTML = _this.svgTemplates.play;
					_this.player.pause();
					return;
				}
				if (_this.active !== null) {
				//	_this.icon.innerHTML = _this.svgTemplates.pause;
					_this.player.continue();
					return;
				}
				if (!_this.playing) {
					_this.icon.innerHTML = _this.svgTemplates.load;
					setTimeout(function() {
						_this.player.play(0);
						_this.DOMScroll.activate(0);
					}, 1000)
				}
				return;
			}
			return;
		};
		_this.svgTemplates = {
			play: '<use xlink:href="#play" />',
			pause: '<use xlink:href="#pause" />',
			load: '<use xlink:href="#load" />',
		};

		_this.init = function (playlistTitle) {
			
			var playContainer = _this.container.getElementsByClassName('audio-list')[0];
			var listContainer = playContainer.getElementsByClassName('player')[0];
			var playerContainer = playContainer.getElementsByClassName('holder')[0];
			var trackCollection = _this.renderTemplate(_this.tracks);
			
			_this.title.textContent = (function(str) {
				var title = str.split('-')[0];
				return title.charAt(0).toUpperCase() + title.slice(1);	
			})(playlistTitle);

			var content = '<svg class="icon">' +_this.svgTemplates.play + '</svg>';
			var button = createElement('button', content, ['class', 'control']);
			playerContainer.append(button);
			_this.icon = playerContainer.getElementsByClassName('icon')[0];
			var listWrapper = createElement('div', '', ['class', 'list']);
			for (var i = 0; i < trackCollection.length; i++) {
				listWrapper.append(trackCollection[i]);
			}
			listContainer.append(listWrapper);
			
			_this.audioElement = document.getElementById('hiddenPlayer');
			_this.DOMScroll = new PlaylistDOM();
			_this.DOMScroll.setup(listContainer, trackCollection);
			Store.register(playlistTitle, _this);
		};

		_this.stop = function () {
			_this.playing = false;
			_this.active = null;
			_this.description.textContent = "";
			_this.currentlyPlaying.style.display = 'none';
			_this.placeholder.style.display='block';
			_this.DOMScroll.stopAll();
			_this.icon.innerHTML = _this.svgTemplates.play;
		}

		_this.player = {
			play: function(index) {
				if (_this.playing == false) {
					Store.stopOtherPlaylists();
				}
				_this.audioElement.setAttribute('src', _this.tracks[index]['stream_url'] + "?client_id=AxxKKJZojwz1G80t09Da2qsZIcd2XaGz");
				_this.description.textContent = _this.tracks[index]['description'];
				_this.currentlyPlaying.style.display = 'block';
				_this.placeholder.style.display='none';
				_this.currentlyPlaying.innerHTML = (function(title, waveform) {
					return [
						'<span>Currently playing: ' + title + '</span>',
						'<div class="waveWrapper">',
						'<svg class="wave">',
    					'<rect id="wavebg" width="100%" height="50" />',
    					'<rect id="playedbg" class="playedbg" width="0" height="50">',
    					'</svg>',
  						'<div class="overlay" style="mask-image:url(\'' + waveform +'\');',
  						' mask:url(\'' + waveform +'\');',
  						' -webkit-mask-image:url(\'' + waveform + '\');"></div>',
  						'<svg class="tracker">',
  						'<rect id="tracker" class="cursor" x="0" y="0" width="2" height="70" />',
  						'</svg>',
  						'</div>'
					].join('');
				})(_this.tracks[index]['title'], _this.tracks[index]['waveform_url']);
				_this.playerCursor.init(_this.tracks[index]['duration']);
				_this.audioElement.addEventListener('ended', function(e) {
					_this.playerCursor.moveToStart();
					_this.playing = false;
					_this.icon.innerHTML = _this.svgTemplates.play;
				});
				_this.audioElement.addEventListener('pause', function(e) {
					_this.playerCursor.stopMoving();
				});
				_this.audioElement.addEventListener('playing', function(e) {
					_this.playerCursor.startMoving();
				});

				_this.playing = true;
				_this.active = index;
				_this.DOMScroll.alignPlayed(index);
				_this.icon.innerHTML = _this.svgTemplates.pause;
				_this.audioElement.play();
			},
			pause: function() {
				_this.playing = false;
				_this.icon.innerHTML = _this.svgTemplates.play;
				_this.audioElement.pause();
			},
			next: function() {
				if (_this.tracks.length == _this.active['index']) {
					return false;
				}
				_this.player.play(_this.tracks[_this.active['index'] + 1]);
			},
			continue: function() {
				_this.playing = true;
				_this.icon.innerHTML = _this.svgTemplates.pause;
				_this.audioElement.play();
			},
			stop: function() {
				_this.stop();
				_this.audioeElement.stop();
			}
		};

		_this.playerCursor = {
			wrapper: function() {
				return _this.currentlyPlaying.getElementsByClassName('waveWrapper')[0];
			},
			cursor: function() {
				return _this.currentlyPlaying.getElementsByClassName('cursor')[0];
			},
			played: function() {
				return _this.currentlyPlaying.getElementsByClassName('playedbg')[0];
			},
			startWidth: 0,
			endWidth: 0,
			init: function (duration) {
				var wrapper = _this.playerCursor.wrapper(),
					cursor = _this.playerCursor.cursor(),
					played = _this.playerCursor.played();
				_this.playerCursor.endWidth = wrapper.offsetWidth;
			    _this.playerCursor.frames = 500;
			    _this.playerCursor.time  = duration;
			},
			moveToStart: function () {
				var cursor = _this.playerCursor.cursor();
				cursor.setAttribute('x', 0);
			},
			startMoving: function () {
				var cursor = _this.playerCursor.cursor();
			    var delta  = Math.floor(_this.playerCursor.endWidth / _this.playerCursor.frames);
			    var current_frame = cursor.getAttribute('x');
				_this.playerCursor.move = setInterval(function () {
					if (current_frame < _this.playerCursor.endWidth) {
						cursor.setAttribute('x', current_frame + delta);
					    current_frame++;
					}
				}, Math.floor(_this.playerCursor.time / _this.playerCursor.endWidth));
			},
			stopMoving: function () {
				clearInterval(_this.playerCursor.move);
			},
		};
	

		_this.renderTemplate = function (tracks) {
			var nodeCollection = [];
			for (var i = 0; i < tracks.length; i++) {
				var node = document.createElement('div');
				var trackTitle = createElement('span', tracks[i]['title'], ['class', 'trackTitle']);
				var trackLength = createElement('span', timeFormat(tracks[i]['duration']), ['class', 'trackLength']);
				node.append(trackTitle);
				node.append(trackLength);
				node.classList.add('trackPlayer');
				node.classList.add('control');
				node.setAttribute('data-src', i);
				nodeCollection.push(node);
			}
			return nodeCollection;
		};
	}
	
	var hiddenPlayer = createElement('audio', null, ['id', 'hiddenPlayer']);
	document.body.append(hiddenPlayer);
	getPlaylists();
	var playlists = Object.keys(tracks);
	var Store = new PlaylistStore();
	for (var i = 0; i < playlists.length; i++) {
		var playlistContainer = document.getElementById(playlists[i]);
		if (playlistContainer !== null) {
			var playlistInstance = new Playlist(playlistContainer, tracks[playlists[i]]);
			playlistInstance.init(playlists[i]);
			var links = playlistContainer.getElementsByClassName('control');
			for (var j = 0; j < links.length; j++) {
				links[j].addEventListener('click', playlistInstance.callback);
			}
		} 
	}
	function PlaylistDOM () {
		var _this = this; 
		_this.height = 400; 
		_this.trackHeight = 65;
		_this.segments = {
			active : 0,
			scrollIndex: 0,
			chunkSize: 6,
			scrollSize: 2,
			chunks: []
		};
		_this.tracklist = null;
		_this.totalTracks = 0;
		_this.loadPrevButton = (function() {
			var node = document.createElement('a');
			node.classList.add('linebutton');
			node.classList.add('prev');
			node.innerHTML = '<svg class="linebutton"><use xlink:href="#prevButton" /></svg>';
			return node;
		})();
		_this.loadNextButton = (function() {
			var node = document.createElement('a');
			node.classList.add('linebutton');
			node.classList.add('next');
			node.innerHTML = '<svg class="linebutton"><use xlink:href="#nextButton" /></svg>';
			return node;
		})();

		_this.calculateOffset = function (index) {
			var center = (_this.height / 2) - Math.floor(_this.trackHeight / 2);
			var currentOffset = parseInt(_this.tracklist.style.top);
			var nextOffset = (index * _this.trackHeight) + currentOffset;
			
			return 0 - (nextOffset - center);
			//return center - nextOffset;
		};
		_this.activate = function (index) {
			_this.tracklist.children[index].setAttribute('data-active', true);
		};

		_this.stopAll = function () {
			var children = _this.tracklist.children;
			for (var i = 0; i < children.length; i++) {
				children[i].removeAttribute('data-active');
			}
		};

		_this.setup = function (element, tracks) {
			_this.tracklist = element.getElementsByClassName('list')[0];
			_this.tracklist.style.top = 0;
			_this.segmentTracks(tracks);
			_this.totalTracks = tracks.length;
		
			element.append(_this.loadNextButton);
			element.prepend(_this.loadPrevButton);
			_this.loadPrevButton.setAttribute('data-active', false);
			_this.loadPrevButton.addEventListener('click', _this.loadPrev);
			_this.loadNextButton.addEventListener('click', _this.loadNext);
			if (_this.totalTracks <= _this.segments.chunkSize) {
				_this.loadNextButton.setAttribute('data-active', false);
			}
		};
		_this.alignPlayed = function (index) {
			if (index < _this.totalTracks) {
				var offset = _this.calculateOffset(index);
				_this.segments.scrollIndex = index;
				if (_this.findChunk(index) !== _this.segments.active) {
					_this.segments.active = _this.segments.active - 1;
				}
				_this.toggleButtonActive();
				_this.animate(offset, _this.tracklist, function(step, element) {
					element.style.top = (parseInt(element.style.top) + step) + "px";
				});
			}
		};
		_this.segmentTracks = function (tracks) {
			var i,j,temparray,chunk = _this.segments.chunkSize;
			for (i=0,j=tracks.length; i<j; i+=chunk) {
			    temparray = tracks.slice(i,i+chunk);
			   _this.segments.chunks.push(temparray);
			}
		};
		
		_this.toggleButtonActive = function () {
			if (_this.segments.active > 0) {
				_this.loadPrevButton.setAttribute('data-active', true);
			} else {

				if (_this.segments.scrollIndex > 0) {
					_this.loadPrevButton.setAttribute('data-active', true);
				} else {
					_this.loadPrevButton.setAttribute('data-active', false);
				}
			}
			if (_this.segments.active < _this.segments.chunks.length) {
			
				if (_this.segments.scrollIndex < (_this.totalTracks - _this.segments.scrollSize)) {
					_this.loadNextButton.setAttribute('data-active', true);
				} else {
					_this.loadNextButton.setAttribute('data-active', false);
				}
			} else {
				_this.loadNextButton.setAttribute('data-active', false);
			}
		};

		_this.loadPrev = function (e) {
			if (e.target.getAttribute('data-active') == "false") {
				return false;
			}
			
			var nextIndex = _this.segments.scrollIndex - _this.segments.scrollSize; 
			if (_this.findChunk(nextIndex) !== _this.segments.active) {
				_this.segments.active = _this.segments.active - 1;
			}
			_this.segments.scrollIndex = nextIndex;
			
			_this.toggleButtonActive();

			_this.animate(_this.segments.scrollSize * _this.trackHeight, _this.tracklist, function(step, element) {
				element.style.top = (parseInt(element.style.top) + step) + "px";
			});
		}
		_this.findChunk = function (num) {
			return Math.ceil(num / _this.segments.chunkSize) - 1;
		}
		_this.loadNext = function (e) {
			if (e.target.getAttribute('data-active') == "false") {
				return false;
			}
			if (_this.segments.active < _this.segments.chunks.length) {
				var nextIndex = _this.segments.scrollIndex + _this.segments.scrollSize; 
				if (_this.findChunk(nextIndex) !== _this.segments.active) {
					_this.segments.active = _this.segments.active + 1;
				}
				_this.segments.scrollIndex = nextIndex;
			}
			_this.toggleButtonActive();

			_this.animate(_this.segments.scrollSize * _this.trackHeight, _this.tracklist, function(step, element) {
				element.style.top = (parseInt(element.style.top) - step) + "px";
			});
		}
		_this.animate = function (end, element, action) {
			var distance      = end,
			    frames        = 30,
			    current_frame = 0,
			    time          = 500,
			    delta         = Math.floor(distance / frames),
			    my_timer;

			my_timer = setInterval(function () {
			    if (current_frame < frames) {
			        action(delta, element);
			    } else {
			        clearInterval(my_timer);
			    }
			    current_frame++;
			}, Math.floor(time / frames));
		}
	}
})(window);