class Point:
    def __init__(self, x, y, data):
        self.x = x
        self.y = y
        self.data = data  # The 'particle' or 'robot'


class QuadTree:
    def __init__(self, boundary, capacity):
        self.boundary = boundary  # A Rectangle (x, y, w, h)
        self.capacity = capacity  # Max points before splitting
        self.points = []  # Points stored in this node
        self.divided = False  # Tracks if it has children

        # Child pointers (The 4 Quadrants)
        self.northwest = None
        self.northeast = None
        self.southwest = None
        self.southeast = None

    def subdivide(self):
        """
        1. Calculate new boundaries (half width/height)
        2. Create 4 new QuadTree instances
        3. Set self.divided = True
        """
        pass

    def insert(self, point):
        """
        1. If point not in boundary, return False
        2. If len(points) < capacity, add point and return True
        3. Otherwise, subdivide() and insert into children leading to return True
        """
        pass

    def query(self, rect):
        """
        1. If boundary doesn't intersect, return empty array
        2. If divided, query deeper quadtrees return combined array
        3. Return all points that are within rect
        """
        pass
