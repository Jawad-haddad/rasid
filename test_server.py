# test_server.py
import pytest
from collections import deque
import statistics

# Import specific functions and variables from your server.py
from server import identify_block_logic, AnchorFilter, THRESH_FRONT, THRESH_MIDDLE

# ==========================================
# TEST 1: LOGIC & ZONES (The 9-Block System)
# ==========================================

def test_block_1_detection():
    """
    Scenario: Device is very close to Left Anchor.
    Expected: Strong Left signal (> -60) -> Front Row + Left Column = Block 1
    """
    # Raw Inputs: Left is strong (-40), others are weak (-90)
    # Note: offsets in your code are added to these.
    result = identify_block_logic(val_left=-40, val_center=-90, val_right=-90)
    assert result == "Block 1"

def test_block_5_detection():
    """
    Scenario: Device is in the middle of the room.
    Expected: Medium Center signal (-65) -> Middle Row + Center Col = Block 5
    """
    # -65 is weaker than THRESH_FRONT (-60) but stronger than THRESH_MIDDLE (-70)
    # This creates "Middle" row.
    result = identify_block_logic(val_left=-90, val_center=-65, val_right=-90)
    assert result == "Block 5"

def test_block_9_detection():
    """
    Scenario: Device is far back right.
    Expected: Weak Right signal (-80) -> Back Row + Right Col = Block 9
    """
    # -80 is weaker than THRESH_MIDDLE (-70), so it falls to "Back" row.
    result = identify_block_logic(val_left=-90, val_center=-90, val_right=-80)
    assert result == "Block 9"

# ==========================================
# TEST 2: CALIBRATION (The Offsets)
# ==========================================

def test_calibration_offsets():
    """
    Scenario: Left (-55) is actually stronger than Center (-58) raw.
    BUT, your code has OFFSET_CENTER = 3.
    Center becomes -55.
    If OFFSET_LEFT is 0, they tie or compete.
    
    Let's test a case where offset changes the winner.
    Suppose:
    Left Raw: -60 (Offset 0) -> Final -60
    Center Raw: -61 (Offset +3) -> Final -58
    
    Winner should be CENTER because -58 > -60.
    """
    result = identify_block_logic(val_left=-60, val_center=-61, val_right=-90)
    # If offsets work, Center (-58) beats Left (-60)
    assert "Center" in str(result) or "5" in str(result) or "2" in str(result) or "8" in str(result)

# ==========================================
# TEST 3: NOISE FILTERING (The Median)
# ==========================================

def test_median_filter_removes_spikes():
    """
    Scenario: Sensor sends a random noise spike (-20) among normal data (-60).
    Expected: The spike should be ignored by the median filter.
    """
    f = AnchorFilter()
    
    # 1. Add normal data
    f.update("Anchor_1", -60)
    f.update("Anchor_1", -60)
    
    # 2. Add ONE huge noise spike (e.g., reflection)
    f.update("Anchor_1", -10) 
    
    # 3. Add more normal data
    f.update("Anchor_1", -60)
    f.update("Anchor_1", -60)
    
    # Median of [-60, -60, -10, -60, -60] is -60. 
    # The -10 should disappear.
    result = f.get_value("Anchor_1")
    assert result == -60
