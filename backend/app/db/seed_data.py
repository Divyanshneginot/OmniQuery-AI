import datetime
import math
import random
import pandas as pd

def generate_box_office_data(num_records: int = 50000) -> pd.DataFrame:
    """Generates box office revenue data for the Film Studio Analytics Command Center."""
    genres = {
        "Action": ["Quantum Strike", "Edge of Tomorrow 2", "Red Phoenix", "Shadow Protocol", "Iron Horizon", "Blitz Recon"],
        "Comedy": ["Wedding Crashers 3", "Office Mayhem", "Laugh Track", "The Sitcom Movie", "Funny Business"],
        "Drama": ["The Last Witness", "Silent River", "A Thousand Sunsets", "Father's Promise", "Broken Crown"],
        "Sci-Fi": ["Nebula Rising", "Mars Colony 7", "The Singularity", "Dark Matter"],
        "Horror": ["The Whispering", "Basement Floor 13", "Night Terrors", "Crimson Manor", "The Reckoning"],
        "Animation": ["Sky Creatures", "Robot Friends Forever", "Paws & Claws Adventure", "The Dream Weavers"]
    }
    
    genre_names = list(genres.keys())
    distributors = ["Universal Pictures", "Warner Bros", "Disney", "Paramount", "Sony Pictures", "A24", "Lionsgate", "Netflix Films"]
    territories = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "India", "China", "Japan"]
    release_windows = ["Theatrical", "Theatrical", "Theatrical", "Theatrical", "Day-and-Date", "Streaming Exclusive", "PVOD"]
    
    base_date = datetime.datetime(2026, 1, 1)
    
    rows = []
    for i in range(1, num_records + 1):
        genre = random.choice(genre_names)
        title = random.choice(genres[genre])
        
        # Box office revenue ranges by genre (in millions, stored as raw dollars)
        revenue_map = {
            "Action": random.uniform(5_000_000, 120_000_000),
            "Comedy": random.uniform(2_000_000, 45_000_000),
            "Drama": random.uniform(1_000_000, 35_000_000),
            "Sci-Fi": random.uniform(8_000_000, 150_000_000),
            "Horror": random.uniform(3_000_000, 80_000_000),
            "Animation": random.uniform(10_000_000, 200_000_000)
        }
        gross_revenue = round(revenue_map[genre] * random.uniform(0.8, 1.4), 2)
        production_budget = round(gross_revenue * random.uniform(0.3, 0.9), 2)
        marketing_spend = round(production_budget * random.uniform(0.2, 0.6), 2)
        net_profit = round(gross_revenue - production_budget - marketing_spend, 2)
        territory = random.choice(territories)
        distributor = random.choice(distributors)
        
        # Release date spread across 2026
        days_offset = random.randint(0, 235)
        release_date = base_date + datetime.timedelta(days=days_offset)
        
        opening_weekend = round(gross_revenue * random.uniform(0.25, 0.55), 2)
        screens = random.randint(800, 4500)
        release_window = random.choice(release_windows)
        
        rows.append({
            "record_id": i,
            "movie_title": title,
            "genre": genre,
            "distributor": distributor,
            "territory": territory,
            "gross_revenue": gross_revenue,
            "opening_weekend": opening_weekend,
            "production_budget": production_budget,
            "marketing_spend": marketing_spend,
            "net_profit": net_profit,
            "screens": screens,
            "release_window": release_window,
            "release_date": release_date.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    return pd.DataFrame(rows)

def generate_streaming_metrics_data(num_records: int = 75000) -> pd.DataFrame:
    """Generates streaming platform telemetry metrics for viewer sessions and content performance."""
    platforms = {
        "content-delivery-cdn": ["/stream/v1/manifest", "/stream/v1/segment", "/stream/v1/drm-license"],
        "viewer-session-service": ["/api/v1/session/start", "/api/v1/session/heartbeat", "/api/v1/session/end"],
        "recommendation-engine": ["/api/v1/personalize/feed", "/api/v1/trending/titles", "/api/v1/watchlist/sync"],
        "search-discovery": ["/api/v1/search/titles", "/api/v1/search/actors", "/api/v1/browse/genre"],
        "analytics-pipeline": ["/api/v1/events/ingest", "/api/v1/metrics/aggregate"]
    }
    
    status_distribution = [200] * 82 + [201] * 5 + [400] * 4 + [401] * 3 + [404] * 2 + [500] * 3 + [504] * 1
    
    base_date = datetime.datetime(2026, 8, 1)
    
    rows = []
    for i in range(1, num_records + 1):
        svc = random.choice(list(platforms.keys()))
        endpoint = random.choice(platforms[svc])
        code = random.choice(status_distribution)
        
        # Latency distribution (ms)
        if svc in ["content-delivery-cdn", "search-discovery"]:
            latency = random.gammavariate(2.0, 18.0) + random.uniform(5, 25)
        elif svc == "viewer-session-service":
            latency = random.gammavariate(3.0, 45.0) + random.uniform(30, 80)
        else:
            latency = random.gammavariate(2.5, 30.0) + random.uniform(10, 40)
            
        if code >= 500:
            latency += random.uniform(200, 1500)
            error_msg = random.choice([
                "CDN edge node connection reset", 
                "DRM license server timeout after 5000ms", 
                "ClickHouse analytics pipeline backpressure", 
                "Transcoding buffer overflow: heap threshold 90%"
            ])
        elif code == 401:
            error_msg = "Viewer subscription token expired"
        elif code == 404:
            error_msg = "Requested content asset not found in catalog"
        elif code == 400:
            error_msg = "Invalid stream manifest request format"
        else:
            error_msg = "None"
            
        cpu_usage = round(min(99.5, max(5.0, random.gauss(42.0, 15.0) + (15.0 if code >= 500 else 0))), 2)
        memory_mb = round(min(4096.0, max(256.0, random.gauss(1024.0, 250.0))), 2)
        
        days_offset = random.randint(0, 23)
        hours_offset = random.randint(0, 23)
        minutes_offset = random.randint(0, 59)
        seconds_offset = random.randint(0, 59)
        event_time = base_date + datetime.timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset, seconds=seconds_offset)
        
        rows.append({
            "log_id": i,
            "event_time": event_time.strftime("%Y-%m-%d %H:%M:%S"),
            "service_name": svc,
            "endpoint": endpoint,
            "status_code": code,
            "latency_ms": round(latency, 2),
            "cpu_usage_pct": cpu_usage,
            "memory_mb": memory_mb,
            "error_message": error_msg
        })
        
    return pd.DataFrame(rows)

def generate_audience_reviews_data(num_records: int = 15000) -> pd.DataFrame:
    """Generates audience review data with semantic embeddings for vector similarity search."""
    positive_comments = [
        ("Absolutely riveting! The cinematography in the third act was breathtaking.", "cinematography_praise"),
        ("Best action sequences I've seen all year. The stunts felt incredibly real.", "action_quality"),
        ("The soundtrack elevated every emotional beat. Oscar-worthy score.", "soundtrack_praise"),
        ("Incredible cast chemistry. The lead duo carried the entire film effortlessly.", "cast_performance"),
        ("Brilliant pacing from start to finish, never a dull moment.", "pacing_praise")
    ]
    
    neutral_comments = [
        ("Decent film, some plot holes but the visuals made up for it.", "plot_neutral"),
        ("Average runtime, nothing groundbreaking but a solid weekend watch.", "general_neutral"),
        ("Good special effects, though the story felt somewhat predictable.", "effects_neutral"),
        ("Entertaining enough for a theater visit, but wouldn't rewatch.", "rewatch_neutral")
    ]
    
    negative_comments = [
        ("Terrible pacing, the second act dragged on for what felt like hours.", "pacing_complaint"),
        ("The CGI was laughably bad, completely broke immersion.", "cgi_complaint"),
        ("Plot made zero sense. Characters acted irrationally the entire time.", "plot_complaint"),
        ("Audio mixing was atrocious, couldn't hear dialogue over the score.", "audio_complaint"),
        ("Streaming quality kept buffering during peak scenes, ruined the experience.", "streaming_issue")
    ]
    
    genres = ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Animation"]
    
    # Topic prototype vectors (16 dimensions)
    topic_prototypes = {
        "cinematography_praise": [0.9, 0.1, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.0],
        "action_quality": [0.0, 0.9, 0.2, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3],
        "soundtrack_praise": [0.0, 0.0, 0.9, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0],
        "cast_performance": [0.1, 0.0, 0.0, 0.9, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0],
        "pacing_praise": [0.0, 0.3, 0.0, 0.0, 0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1],
        "plot_neutral": [0.1, 0.2, 0.0, 0.0, 0.0, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0],
        "general_neutral": [0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        "effects_neutral": [0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        "rewatch_neutral": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        "pacing_complaint": [0.0, 0.0, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
        "cgi_complaint": [0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 0.0, 0.0, 0.0, 0.0, 0.0],
        "plot_complaint": [0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.9, 0.0, 0.0, 0.0, 0.0],
        "audio_complaint": [0.0, 0.2, 0.0, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 0.0, 0.0, 0.0],
        "streaming_issue": [0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7, 0.0, 0.9, 0.0, 0.0]
    }
    
    rows = []
    base_date = datetime.datetime(2026, 3, 1)
    for i in range(1, num_records + 1):
        r = random.random()
        if r < 0.65:
            sentiment = "Positive"
            rating = random.choice([4, 5, 5])
            comment, topic = random.choice(positive_comments)
        elif r < 0.85:
            sentiment = "Neutral"
            rating = 3
            comment, topic = random.choice(neutral_comments)
        else:
            sentiment = "Negative"
            rating = random.choice([1, 1, 2])
            comment, topic = random.choice(negative_comments)
            
        genre = random.choice(genres)
        feedback_date = base_date + datetime.timedelta(days=random.randint(0, 160), hours=random.randint(0, 23))
        
        # Add slight noise and normalize vector
        proto = topic_prototypes.get(topic, [random.random() for _ in range(16)])
        vec = [p + random.gauss(0, 0.05) for p in proto]
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        
        rows.append({
            "feedback_id": i,
            "viewer_id": random.randint(1000, 9999),
            "genre": genre,
            "rating": rating,
            "sentiment": sentiment,
            "topic_cluster": topic,
            "comment": comment,
            "embedding": [round(float(v), 4) for v in vec],
            "created_at": feedback_date.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    return pd.DataFrame(rows)
